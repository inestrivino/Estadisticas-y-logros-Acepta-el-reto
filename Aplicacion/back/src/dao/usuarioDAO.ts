import DAO from "./DAO.js";
import redisClient from '../redis/redisClient.js';
import { datosUsuario } from "../types/datosUsuario.js";

class UsuarioDAO extends DAO {

    /**
     * Registra en Redis un bloque de envios de usuario usando un pipeline para minimizar llamadas.
     * @param envios - Array de envios procesados a registrar.
     */
    public async registrarBloqueEnvios(envios: datosUsuario[]): Promise<void> {
        const pipeline = this.redis.multi();
        for (const envio of envios) {
            pipeline.sAdd("usuarios", envio.usuario);
            pipeline.zAdd(
                `usuario:${envio.usuario}:dias`,
                [{ value: String(envio.fecha), score: envio.fecha }]
            );
            pipeline.hIncrBy(
                `usuario:${envio.usuario}:diasValor`,
                String(envio.fecha),
                1
            );
            //mete el usuario en ese timestamp (para no iterar por los usuarios al borrar)
            pipeline.sAdd(
                `timestamp:${envio.fecha}`,
                envio.usuario
            );

            pipeline.hIncrBy(`usuario:${envio.usuario}:resultados`, envio.resultado, 1);
            pipeline.hIncrBy(`usuario:${envio.usuario}:lenguajes`, envio.lenguaje, 1);
            pipeline.incr(`usuario:${envio.usuario}:envios`);
            pipeline.sAdd(`usuario:${envio.usuario}:horas`, String(envio.hora));

            //TODO quitar cuando se use el timestamp de usuario:${envio.usuario}:dias
            pipeline.set(`usuario:${envio.usuario}:fechaUltimoEnvio`, String(envio.fecha));

            if (envio.resultado === "AC") {
                pipeline.sAdd(`usuario:${envio.usuario}:problemasAC`, envio.problema);
                //Añade el problema resuelto al listado del lenguaje con el que se ha resuelto
                pipeline.sAdd(`usuario:${envio.usuario}:lenguaje:${envio.lenguaje}`, envio.problema);
                //pipeline.incr(`usuario:${envio.usuario}:enviosAC`); //TODO borrar
                //pipeline.sAdd(`usuario:${envio.usuario}:categoriasAC`, envio.categoria); //TODO categorias problemas
                pipeline.hIncrBy(`usuario:${envio.usuario}:lenguajesAC`, envio.lenguaje, 1);
            } else {
                pipeline.sAdd(`usuario:${envio.usuario}:problemasNoAC`, envio.problema);
            }

            //TODO cuando se cambie lo de que coja el ultimo elemento de dias tambien hay que cambiarlo aqui
            const fechaUltimoEnvioStr = await this.redis.get(`usuario:${envio.usuario}:fechaUltimoEnvio`);
            const tiempoEntreEnvios = envio.fecha - (fechaUltimoEnvioStr ? Number(fechaUltimoEnvioStr) : 0);

            const rachaDiasEnvioStr = await this.redis.get(`usuario:${envio.usuario}:rachaDiasEnvio`);
            let rachaDiasEnvio = rachaDiasEnvioStr ? Number(rachaDiasEnvioStr) : 0;

            if (tiempoEntreEnvios === 86400) { //un dia
                pipeline.incr(`usuario:${envio.usuario}:rachaDiasEnvio`);
                rachaDiasEnvio += 1;
            } else if (tiempoEntreEnvios !== 86400) {
                pipeline.set(`usuario:${envio.usuario}:rachaDiasEnvio`, 1);
                rachaDiasEnvio = 1;
            }
            const rachaDiasEnvioMaxStr = await this.redis.get(`usuario:${envio.usuario}:rachaDiasEnvioMax`);
            const rachaDiasEnvioMax = rachaDiasEnvioMaxStr ? Number(rachaDiasEnvioMaxStr) : 0;
            if (rachaDiasEnvio > rachaDiasEnvioMax)
                pipeline.set(`usuario:${envio.usuario}:rachaDiasEnvioMax`, String(rachaDiasEnvio));

            if (envio.resultado === "AC" && !(await this.tieneProblemaEnvioIncorrecto(envio.usuario, envio.problema))) {
                pipeline.incr(`usuario:${envio.usuario}:rachaEnviosAC`);
                const rachaEnviosACStr = await this.redis.get(`usuario:${envio.usuario}:rachaEnviosAC`);
                const rachaEnviosAC = (rachaEnviosACStr ? Number(rachaEnviosACStr) : 0) + 1;
                const rachaEnviosACMaxStr = await this.redis.get(`usuario:${envio.usuario}:rachaEnviosACMax`);
                const rachaEnviosACMax = rachaEnviosACMaxStr ? Number(rachaEnviosACMaxStr) : 0;
                if (rachaEnviosAC > rachaEnviosACMax)
                    pipeline.set(`usuario:${envio.usuario}:rachaEnviosACMax`, String(rachaEnviosAC));
            } else {
                pipeline.set(`usuario:${envio.usuario}:rachaEnviosAC`, "0");
            }
        }
        await pipeline.exec();
    }

    /**
     * Devuelve el conteo de cada resultado del usuario ordenado alfabeticamente.
     * @param usuario - Identificador del usuario.
     * @returns Array de pares `{ name, value }` ordenado por nombre.
     */
    async getResultados(usuario: string): Promise<{ name: string, value: number }[]> {
        const datos = await this.redis.hGetAll(`usuario:${usuario}:resultados`);

        const formateados: { name: string, value: number }[] = [];
        for (const aux of Object.entries(datos))
            formateados.push({ name: aux[0], value: Number(aux[1]) })

        formateados.sort((a, b) => a.name.localeCompare(b.name));

        return formateados;
    }

    /**
     * Devuelve el conteo de envios por lenguaje del usuario ordenado alfabeticamente.
     * @param usuario - Identificador del usuario.
     * @returns Array de pares `{ name, value }` ordenado por nombre.
     */
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

    /**
     * devuelve el timestamp en segundos del ultimo envio realizado por el usuario,
     * o 0 si el usuario no tiene envios registrados
     * @param usuario - identificador del usuario
     * @returns timestamp en segundos del ultimo envio, o 0 si no tiene envios registrados
     */
    async getUltimoEnvioUsuario(usuario: string): Promise<number> {
        const fechaStr = await this.redis.get(`usuario:${usuario}:fechaUltimoEnvio`);
        return fechaStr ? Number(fechaStr) : 0;
    }

    /**
     * Elimina de Redis todos los registros de envios del dia indicado.
     * @param timeStamp - Timestamp en segundos correspondiente al dia a eliminar.
     */
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

    /**
     * Devuelve el numero total de envios del usuario, o 0 si no tiene ninguno.
     * @param usuario - Identificador del usuario.
     * @returns Numero de envios.
     */
    async getNumEnvios(usuario: string): Promise<number> {
        const enviosStr = await this.redis.get(`usuario:${usuario}:envios`);
        const envios = enviosStr ? Number(enviosStr) : 0;
        return envios;
    }

    /**
     * Devuelve el numero de problemas resueltos correctamente por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de problemas con resultado AC.
     */
    async getNumProblemasResueltos(usuario: string): Promise<number> {
        const numProblemasResueltos = await this.redis.sCard(`usuario:${usuario}:problemasAC`);
        return numProblemasResueltos;
    }

    /**
     * Devuelve el listado de identificadores de problemas resueltos por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Array con los identificadores de los problemas resueltos.
     */
    async getProblemasResueltos(usuario: string): Promise<string[]> {
        return await this.redis.sMembers(`usuario:${usuario}:problemasAC`);
    }

    /**
     * Indica si el usuario tiene algun envio incorrecto previo para el problema dado.
     * @param usuario - Identificador del usuario.
     * @param problema - Identificador del problema.
     * @returns `true` si existe al menos un envio incorrecto, `false` en caso contrario.
     */
    async tieneProblemaEnvioIncorrecto(usuario: string, problema: string): Promise<boolean> {
        const tieneEnvioIncorrecto = await this.redis.sIsMember(`usuario:${usuario}:problemasNoAC`, problema);
        return Boolean(tieneEnvioIncorrecto);
    }

    /**
     * Devuelve el numero de problemas resueltos por el usuario usando el lenguaje indicado.
     * @param usuario - Identificador del usuario.
     * @param lenguaje - Nombre del lenguaje de programacion.
     * @returns Numero de problemas resueltos con ese lenguaje.
     */
    async getNumProblemasLenguaje(usuario: string, lenguaje: string): Promise<number> {
        const a = await this.redis.hKeys(`usuario:${usuario}:lenguajes`);
        const problemasResueltos = await this.redis.sCard(`usuario:${usuario}:lenguaje:${lenguaje}`);
        const numProblemas = problemasResueltos ? Number(problemasResueltos) : 0;
        return numProblemas;
    }

    /**
     * Devuelve el listado de problemas resueltos por el usuario con el lenguaje indicado.
     * @param usuario - Identificador del usuario.
     * @param lenguaje - Nombre del lenguaje de programacion.
     * @returns Array con los identificadores de los problemas resueltos.
     */
    async getProblemasLenguaje(usuario: string, lenguaje: string): Promise<string[]> {
        return await this.redis.sMembers(`usuario:${usuario}:lenguaje:${lenguaje}`);
    }

    /**
     * Devuelve el numero de lenguajes distintos usados por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de lenguajes distintos.
     */
    async getNumLenguajesUsados(usuario: string): Promise<number> {
        const numLenguajes = await this.redis.hLen(`usuario:${usuario}:lenguajes`);
        return numLenguajes;
    }

    /**
     * Devuelve la racha maxima de envios correctos consecutivos del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Longitud de la racha maxima de envios correctos.
     */
    async getRachaEnviosCorrectos(usuario: string): Promise<number> {
        const rachaStr = await this.redis.get(`usuario:${usuario}:rachaEnviosACMax`);
        const racha = rachaStr ? Number(rachaStr) : 0;
        return racha;
    }

    /**
     * Devuelve la racha maxima de dias consecutivos con envios del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Longitud de la racha maxima de dias consecutivos.
     */
    async getRachaDiasEnviosConsecutivos(usuario: string): Promise<number> {
        const rachaStr = await this.redis.get(`usuario:${usuario}:rachaDiasEnvioMax`);
        const racha = rachaStr ? Number(rachaStr) : 0;
        return racha;
    }

    /**
     * Devuelve el numero de categorias distintas de problemas resueltos por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de categorias distintas.
     */
    async getNumCategoriasProblemasResueltos(usuario: string): Promise<number> {
        const numCategorias = await this.redis.sCard(`usuario:${usuario}:categoriasAC`);
        return numCategorias;
    }

    /**
     * Devuelve el listado de horas del dia (0-23) en las que el usuario ha hecho envios.
     * @param usuario - Identificador del usuario.
     * @returns Array de horas sin repeticion.
     */
    async getHoras(usuario: string): Promise<number[]> {
        const horas = await this.redis.sMembers(`usuario:${usuario}:horas`);
        const valorHoras = horas.map(hora => Number(hora));
        return valorHoras;
    }

    async existeUsuario(usuario: string): Promise<boolean> {
        const existe = await this.redis.sIsMember("usuarios", usuario);
        return existe === 1;
    }
}

export default new UsuarioDAO();