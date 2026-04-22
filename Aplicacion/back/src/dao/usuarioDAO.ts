import DAO from "./DAO.js";
import dateToTimestamp from "../utils/fecha.js";

type datosUsuario = {
    envioId: number,
    usuario: string,
    problema: string,
    resultado: string,
    lenguaje: string,
    //categoria: string, //TODO categorias problemas
    fecha: {
        dia: number,
        mes: number,
        anio: number,
        hora: number
    }
};

export default class UsuarioDAO extends DAO {

    //Funcion para introducir solo 1 datos
    async registrarDirecto(dato: datosUsuario): Promise<void> {
        const pipeline = this.redis.multi();
        await this.agregarAlPipeline(dato, pipeline);
        await this.procesosFueraDelPipeline(dato, pipeline);
        await pipeline.exec();
    }

    async agregarAlPipeline(dato: datosUsuario, pipeline: any): Promise<void> {
        //guardo el timeStamp en segundos
        const timeStamp = dateToTimestamp(dato.fecha);

        //INCREMENTA LOS ENVIOS DE UN USUARIO
        //primero registra el dia del envio
        pipeline.zAdd(
            `usuario:${dato.usuario}:dias`,
            [{ value: String(timeStamp), score: timeStamp }]
        );
        //luego suma 1 a los envios de ese dia
        pipeline.hIncrBy(
            `usuario:${dato.usuario}:diasValor`,
            String(timeStamp),
            1
        );

        //mete el usuario en ese timestamp (para no iterar por los usuario al borrar)
        pipeline.sAdd(
            `timestamp:${timeStamp}`,
            dato.usuario
        )

        pipeline.hIncrBy(`usuario:${dato.usuario}:resultados`, dato.resultado, 1);
        pipeline.hIncrBy(`usuario:${dato.usuario}:lenguajes`, dato.lenguaje, 1);

        pipeline.incr(`usuario:${dato.usuario}:envios`);
        pipeline.sAdd(`usuario:${dato.usuario}:franjasHorarias`, String(dato.fecha.hora));

        //TODO esto se tendría que quitar y usar el timestamp de usuario:${usuario}:dias
        pipeline.set(`usuario:${dato.usuario}:fechaUltimoEnvio`, String(timeStamp));

        if (dato.resultado === "AC") {
            pipeline.sAdd(`usuario:${dato.usuario}:problemasAC`, dato.problema);
            //Añade el problemas resuelto al listado del lenguaje con el que se ha resuelto
            pipeline.sAdd(`usuario:${dato.usuario}:lenguaje:${dato.lenguaje}`, dato.problema);
            //pipeline.incr(`usuario:${dato.usuario}:enviosAC`); //TODO borrar
            //pipeline.sAdd(`usuario:${dato.usuario}:categoriasAC`, dato.categoria); //TODO categorias problemas
            pipeline.hIncrBy(`usuario:${dato.usuario}:lenguajesAC`, dato.lenguaje, 1);
        } else {
            pipeline.sAdd(`usuario:${dato.usuario}:problemasNoAC`, dato.problema);
        }
    }

    async procesosFueraDelPipeline(dato: datosUsuario, pipeline: any) {
        //TODO cuando se cambie lo de que coja el ulmito elemento de dias tambien hay que cambiarlo aqui
        const fechaUltimoEnvioStr = await this.redis.get(`usuario:${dato.usuario}:fechaUltimoEnvio`);
        const fechaUltimoEnvio = fechaUltimoEnvioStr ? Number(fechaUltimoEnvioStr) : 0;
        const fechaAux = new Date(dato.fecha.anio, dato.fecha.mes, dato.fecha.dia);
        const fechaEnvio = fechaAux.valueOf() / 1000;
        const tiempoEntreEnvios = fechaEnvio - fechaUltimoEnvio;

        const rachaDiasEnvioStr = await this.redis.get(`usuario:${dato.usuario}:rachaDiasEnvio`);
        let rachaDiasEnvio = rachaDiasEnvioStr ? Number(rachaDiasEnvioStr) : 0;

        if (tiempoEntreEnvios === 86400) { //un dia
            pipeline.incr(`usuario:${dato.usuario}:rachaDiasEnvio`);
            rachaDiasEnvio += 1;
        } else if (tiempoEntreEnvios !== 86400) {
            pipeline.set(`usuario:${dato.usuario}:rachaDiasEnvio`, 1);
            rachaDiasEnvio = 1;
        }
        const rachaDiasEnvioMaxStr = await this.redis.get(`usuario:${dato.usuario}:rachaDiasEnvioMax`);
        const rachaDiasEnvioMax = rachaDiasEnvioMaxStr ? Number(rachaDiasEnvioMaxStr) : 0;
        if (rachaDiasEnvio > rachaDiasEnvioMax) {
            pipeline.set(`usuario:${dato.usuario}:rachaDiasEnvioMax`, String(rachaDiasEnvio));
        }

        if (dato.resultado === "AC" && !(await this.tieneProblemaEnvioIncorrecto(dato.usuario, dato.problema))) {
            pipeline.incr(`usuario:${dato.usuario}:rachaEnviosAC`);
            const rachaEnviosACStr = await this.redis.get(`usuario:${dato.usuario}:rachaEnviosAC`);
            const rachaEnviosAC = (rachaEnviosACStr ? Number(rachaEnviosACStr) : 0) + 1;
            const rachaEnviosACMaxStr = await this.redis.get(`usuario:${dato.usuario}:rachaEnviosACMax`);
            const rachaEnviosACMax = rachaEnviosACMaxStr ? Number(rachaEnviosACMaxStr) : 0;
            if (rachaEnviosAC > rachaEnviosACMax) {
                pipeline.set(`usuario:${dato.usuario}:rachaEnviosACMax`, String(rachaEnviosAC));
            }
        } else {
            pipeline.set(`usuario:${dato.usuario}:rachaEnviosAC`, "0");
        }
    }

    //TODO poner jdoc
    //Devuelve el resultado ordenado alfabeticamente por nombre
    async getResultados(usuario: string): Promise<{ name: string, value: number }[]> {
        const datos = await this.redis.hGetAll(`usuario:${usuario}:resultados`);

        const formateados: { name: string, value: number }[] = [];
        for (const aux of Object.entries(datos))
            formateados.push({ name: aux[0], value: Number(aux[1]) })

        formateados.sort((a, b) => a.name.localeCompare(b.name));

        return formateados;
    }

    //TODO poner jdoc
    //Devuelve el resultado ordenado alfabeticamente por nombre
    async getLenguajes(usuario: string): Promise<{ name: string, value: number }[]> {
        const datos = await this.redis.hGetAll(`usuario:${usuario}:lenguajes`);

        const formateados: { name: string, value: number }[] = [];
        for (const aux of Object.entries(datos))
            formateados.push({ name: aux[0], value: Number(aux[1]) })

        formateados.sort((a, b) => a.name.localeCompare(b.name));

        return formateados;
    }

    /**
     * Devuelve los envios dentro de un periodo de tiempo
     * @param usuario - usuario del que se quiero hacer la consulta
     * @param timeIni - timestamp en segundos de la hora 00:00 del primero dia del intervalo
     * @param timeFin - timestamp en segundos de la hora 00:00 del ultimo dia del intervalo                 
     * @returns - un array con tantos elementos {timestamp:number, value:number} como dias en el intervalo
     */
    async getEnviosUsuario(usuario: string, timeIni: number, timeFin: number) {

        //saco los dias (timeStamps) en los que hizo envios y la cantidad (valores)
        const timeStamps = await this.redis.zRangeWithScores(`usuario:${usuario}:dias`, 0, -1);
        const valores = await this.redis.hGetAll(`usuario:${usuario}:diasValor`);

        //vinculo cada dia con su cantidad
        let resultados = []
        for (const timeStamp of timeStamps) {
            //por si se han quedado datos viejos por algun error solo coge los nuevos
            if (timeStamp.score < timeIni)
                continue;
            //por si en algun momento se quisiera pedir un intervalo que no llega hasta hoy
            if (timeStamp.score > timeFin)
                continue;

            resultados.push({
                timeStamp: timeStamp.score,
                value: Number(valores[timeStamp.value])
            });
        }

        //formateo los datos
        let formateados = [];
        let contador = 0;
        let current = -1;
        if (resultados.length > 0)
            current = resultados[0].timeStamp;
        for (let i = timeIni; i <= timeFin; i += 86400) { // 86400 = 24 * 60 * 60
            if (i != current) {
                formateados.push({ timeStamp: i, value: 0 });
            }
            else {
                formateados.push({ timeStamp: i, value: resultados[contador].value });
                contador++;
                if (contador != resultados.length)
                    current = resultados[contador].timeStamp;
            }
        }

        return formateados;
    }

    async eliminarEnviosDia(timeStamp: number) {

        const usuarios = await this.redis.sMembers(`timestamp:${timeStamp}`);

        //juntas las operaciones para hacer solo una llamada
        const pipeline = this.redis.multi();

        //se quitan los envios de todos los usuario que hicieron un envio ese dia
        for (const usuario of usuarios) {
            pipeline.zRem(`usuario:${usuario}:dias`, String(timeStamp));
            //TODO quitar tambien de diasValor
            //pipeline.hDel(`usuario:${usuario}:diasValor`, String(timeStamp));
        }

        await pipeline.exec();

        //se borra el set con los usuario de ese dia
        await this.redis.del(`timestamp:${timeStamp}`);
    }

    async getLogros(usuario: string) {
        const logros = await this.redis.sMembers(`usuario:${usuario}:logros`);
        return logros;
    }

    async guardarLogros(usuario: string, logros: string[], pipeline?: any) {
        if (logros.length > 0) {
            if (pipeline) {
                pipeline.sAdd(`usuario:${usuario}:logros`, logros);
            }
            else {
                await this.redis.sAdd(`usuario:${usuario}:logros`, logros);
            }
        }
    }

    async getNumEnvios(usuario: string): Promise<number> {
        const enviosStr = await this.redis.get(`usuario:${usuario}:envios`);
        const envios = enviosStr ? Number(enviosStr) : 0;
        return envios;
    }

    async getNumProblemasResueltos(usuario: string): Promise<number> {
        const numProblemasResueltos = await this.redis.sCard(`usuario:${usuario}:problemasAC`);
        return numProblemasResueltos;
    }

    async tieneProblemaEnvioIncorrecto(usuario: string, problema: string): Promise<boolean> {
        const tieneEnvioIncorrecto = await this.redis.sIsMember(`usuario:${usuario}:problemasNoAC`, problema);
        return Boolean(tieneEnvioIncorrecto);
    }

    async getNumProblemasLenguaje(usuario: string, lenguaje: string): Promise<number> {
        const a = await this.redis.hKeys(`usuario:${usuario}:lenguajes`);
        const problemasResueltos = await this.redis.sCard(`usuario:${usuario}:lenguaje:${lenguaje}`);
        const numProblemas = problemasResueltos ? Number(problemasResueltos) : 0;
        return numProblemas;
    }

    async getNumLenguajesUsados(usuario: string): Promise<number> {
        const numLenguajes = await this.redis.hLen(`usuario:${usuario}:lenguajes`);
        return numLenguajes;
    }

    async getRachaMaximaEnviosCorrectos(usuario: string): Promise<number> {
        const rachaStr = await this.redis.get(`usuario:${usuario}:rachaEnviosACMax`);
        const racha = rachaStr ? Number(rachaStr) : 0;
        return racha;
    }

    async getRachaMaximaDiasConEnvio(usuario: string): Promise<number> {
        const rachaStr = await this.redis.get(`usuario:${usuario}:rachaDiasEnvioMax`);
        const racha = rachaStr ? Number(rachaStr) : 0;
        return racha;
    }

    async getNumCategoriasProblemasResueltos(usuario: string): Promise<number> {
        const numCategorias = await this.redis.sCard(`usuario:${usuario}:categoriasAC`);
        return numCategorias;
    }

    async getNumFranjasHorariasConEnvio(usuario: string): Promise<number> {
        const numFranjasHorarias = await this.redis.sCard(`usuario:${usuario}:franjasHorarias`);
        return numFranjasHorarias;
    }

    /**
     * Devuelve los usuarios que se encuentran entre las posiciones ini y fin del ranking.
     * @param ini - Posicion inicial del rango.
     * @param fin - Posicion final del rango.
     * @returns Array con el nombre y el xp de los usuarios que se encuentran entre esas posiciones en el ranking global.
     */
    async getUsuariosRankingPorRango(ini: number, fin: number): Promise<{ value: string; score: number }[]> {
        const usuarios = await this.redis.zRangeWithScores(`usuario:ranking`, ini, fin, { REV: true });
        return usuarios;
    }

    /**
     * Devuelve los usuarios del nivel correspondiente al rango de xp [iniNivel, finNivel] que se encuentran entre
     * las posiciones ini y fin (dentro del propio nivel)
     * @param ini - Posicion inicial del rango (dentro del nivel).
     * @param fin - Posicion final del rango (dentro del nivel).
     * @param iniNivel - Valor de XP (score dentro del haz) que marca el limite inicial del nivel del que queremos devolver los usuarios.
     * @param finNivel - Valor de XP (score dentro del haz) que marca el limite final del nivel del que queremos devolver los usuarios.
     * @returns Array con el nombre y el xp de los usuarios que se encuentran entre esas posiciones en el ranking del nivel correspondiente.
     */
    async getUsuariosRankingPorRangoYNivel(ini: number, fin: number, iniNivel: number, finNivel: number):
        Promise<{ value: string; score: number }[]> {

        const usuarios = await this.redis.zRangeWithScores(`usuario:ranking`, finNivel, iniNivel,
            { BY: 'SCORE', REV: true, LIMIT: { offset: ini, count: fin - ini + 1, } });

        return (usuarios ?? []) as { value: string; score: number }[];
    }

    /**
     * Devuelve la posicion de usuario en el ranking de xp.
     * @param usuario - Identificador del usuario.
     * @returns Entero > 0 en caso de estar el usuario en el ranking o -1 en caso de no estar.
     */
    async getPosUsuarioEnRanking(usuario: string): Promise<number> {
        const pos = await this.redis.zRevRank(`usuario:ranking`, usuario);
        return pos !== null ? pos + 1 : -1;
    }

    //TODO tener en cuenta que aqui saldran solo los que han realizado por lo menos un envio, y por tanto tienen algo de xp
    /**
     * Devuelve el numero de usuarios que hay en el ranking.
     * @returns Entero >= 0 que indica el numero de usuario en el ranking.
     */
    async getNumUsuarios(): Promise<number> {
        const numUsuarios = await this.redis.zCard(`usuario:ranking`);
        return numUsuarios;
    }

    /**
     * Devuelve la cantidad de usuarios que tengan XP entre ini y fin.
     * @param ini - Valor de XP que representa el limite inicial del rango, correspondiente al score en el haz.
     * @param fin - Valor de XP que representa el limite final del rango, correspondiente al score en el haz.
     * @returns Numero de usuarios que cumplan la condicion >= 0.
     */
    async getNumUsuariosEnRango(ini: number, fin: number): Promise<number> {
        const numUsuarios = await this.redis.zCount(`usuario:ranking`, ini, fin);
        return numUsuarios;
    }

    /**
     * Devuelve la cantidad de xp que tiene usuario.
     * @param usuario - Identificador del usuario.
     * @returns Entero > 0 si existe el usuario en el ranking, o -1 en caso de no estar.
     */
    async getXPUsuario(usuario: string): Promise<number> {
        const xp = await this.redis.zScore(`usuario:ranking`, usuario);
        return xp !== null ? xp : -1
    }
}