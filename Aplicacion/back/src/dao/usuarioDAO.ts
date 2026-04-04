import DAO from "./DAO.js";
import logros from "../transfers/logros.js";
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
            pipeline.incr(`usuario:${dato.usuario}:enviosAC`);
            pipeline.incr(`usuario:${dato.usuario}:rachaEnviosAC`);
            //pipeline.sAdd(`usuario:${dato.usuario}:categoriasAC`, dato.categoria); //TODO categorias problemas
            pipeline.hIncrBy(`usuario:${dato.usuario}:lenguajesAC`, dato.lenguaje, 1);
        } else {
            pipeline.sAdd(`usuario:${dato.usuario}:problemasNoAC`, dato.problema);
            pipeline.set(`usuario:${dato.usuario}:rachaEnviosAC`, "0");
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

        if (dato.resultado === "AC") {
            const rachaEnviosACStr = await this.redis.get(`usuario:${dato.usuario}:rachaEnviosAC`);
            const rachaEnviosAC = (rachaEnviosACStr ? Number(rachaEnviosACStr) : 0) + 1;
            const rachaEnviosACMaxStr = await this.redis.get(`usuario:${dato.usuario}:rachaEnviosACMax`);
            const rachaEnviosACMax = rachaEnviosACMaxStr ? Number(rachaEnviosACMaxStr) : 0;
            if (rachaEnviosAC > rachaEnviosACMax) {
                pipeline.set(`usuario:${dato.usuario}:rachaEnviosACMax`, String(rachaEnviosAC));
            }
        }
    }

    //TODO poner jdoc
    //Devuelve el resultado ordenado alfabeticamente por nombre
    async getResultados(usuario: string): Promise<{name: string, value: number}[]> {
        const datos = await this.redis.hGetAll(`usuario:${usuario}:resultados`);

        const formateados: {name: string, value: number}[] = [];
        for (const aux of Object.entries(datos))
            formateados.push({name:aux[0], value:Number(aux[1])})

        formateados.sort((a, b) => a.name.localeCompare(b.name));

        return formateados;
    }

    //TODO poner jdoc
    //Devuelve el resultado ordenado alfabeticamente por nombre
    async getLenguajes(usuario: string): Promise<{name: string, value: number}[]> {
        const datos = await this.redis.hGetAll(`usuario:${usuario}:lenguajes`);

        const formateados: {name: string, value: number}[] = [];
        for (const aux of Object.entries(datos))
            formateados.push({name:aux[0], value:Number(aux[1])})

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

    async getLogrosUsuario(usuario: string, clasificacion: string) {
        const setLogros = new Set(await this.redis.sMembers(`usuario:${usuario}:logros`));

        //agrega el etributo de si el usuario tiene ese logro o no
        const logrosUsuario = logros.map(logro => ({ ...logro, obtenido: setLogros.has(logro.nombre) }));

        //agrupa todos los logros en los grupos correspondientes segun la clasificacion seleccionada
        const gruposMap = new Map();
        for (const logro of logrosUsuario) {
            const key = clasificacion === "nivel" ? logro.nivel : logro.categoria;
            if (!gruposMap.has(key)) {
                gruposMap.set(key, []);
            }
            gruposMap.get(key).push(logro);
        }

        //transforma el map a una estructura similar a la del tipo TGrupoLogros 
        const grupos = Array.from(gruposMap.entries()).map(([grupo, logros]) => ({ grupo, logros }));
        return { clasificacion, grupos };
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
}