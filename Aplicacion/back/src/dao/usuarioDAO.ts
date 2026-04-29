import DAO from "./DAO.js";
import redisClient from '../redis/redisClient.js';
import { datosUsuario } from "../types/datosUsuario.js";
import { EstadoUsuario } from "../types/estadoUsuario.js";

class UsuarioDAO extends DAO {

    //TODO metodo que en vez de iterar de nuevo por los envios mete el estado de un usuario

    /**
     * Registra en Redis un bloque de envios de usuario usando un pipeline para minimizar llamadas.
     * @param envios - Array de envios procesados a registrar.
     */
    /*
    public async registrarBloqueEnvios(envios: datosUsuario[]): Promise<void> {

        const pipeline = this.redis.multi();

        for (const envio of envios) {
            pipeline.sAdd("usuarios", envio.usuario);
            pipeline.zAdd(
                `usuario:${envio.usuario}:dias`,
                [{ value: String(envio.fecha), score: envio.fecha }]
            );
            //y la cantidad de envios de ese dia en un hash
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

            //se suma 1 al resultado del envio y al lenguaje usado, y se incrementa el numero total de envios
            pipeline.hIncrBy(`usuario:${envio.usuario}:resultados`, envio.resultado, 1);
            pipeline.hIncrBy(`usuario:${envio.usuario}:lenguajes`, envio.lenguaje, 1);
            pipeline.incr(`usuario:${envio.usuario}:envios`);

            //se mete la hora del envio en un set de horas en las que se han hecho envios
            pipeline.sAdd(`usuario:${envio.usuario}:horas`, String(envio.hora));

            //se actualiza el timestamp del ultimo envio del usuario
            pipeline.set(`usuario:${envio.usuario}:fechaUltimoEnvio`, String(envio.fecha));

            //si el resultado es cierto
            if (envio.resultado === "AC") {

                //mete el problema resuelto en un set de problemas resueltos del usuario
                pipeline.sAdd(`usuario:${envio.usuario}:problemasAC`, envio.problema);

                //mete el problema resuelto al listado del lenguaje con el que se ha resuelto
                pipeline.sAdd(`usuario:${envio.usuario}:lenguaje:${envio.lenguaje}`, envio.problema);

                //mete la categoria del problema resuelto en un set de categorias de problemas resueltos
                pipeline.hIncrBy(`usuario:${envio.usuario}:lenguajesAC`, envio.lenguaje, 1);
            }

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
    */

    /**
     * Persiste en Redis el estado completo de cada usuario del mapa usando un pipeline.
     * Sobreescribe todos los campos calculados durante el procesamiento del bloque.
     * @param estadosUsuarios - Mapa de identificador de usuario a su estado final.
     */
    public async registrarEstadosUsuarios(estadosUsuarios: Map<string, EstadoUsuario>): Promise<void> {
        const pipeline = this.redis.multi();

        for (const [usuario, estado] of estadosUsuarios) {

            pipeline.set(`usuario:${usuario}:envios`, String(estado.numEnvios));
            pipeline.set(`usuario:${usuario}:fechaUltimoEnvio`, String(estado.ultimoDiaEnvio));
            pipeline.set(`usuario:${usuario}:rachaEnviosAC`, String(estado.rachaEnviosAC));
            pipeline.set(`usuario:${usuario}:rachaEnviosACMax`, String(estado.rachaEnviosACMax));
            pipeline.set(`usuario:${usuario}:rachaDiasEnvio`, String(estado.rachaDiasEnvio));
            pipeline.set(`usuario:${usuario}:rachaDiasEnvioMax`, String(estado.rachaDiasEnvioMax));

            if (estado.problemasAC.size > 0)
                pipeline.sAdd(`usuario:${usuario}:problemasAC`, Array.from(estado.problemasAC));

            if (estado.horas.size > 0)
                pipeline.sAdd(`usuario:${usuario}:horas`, Array.from(estado.horas).map(String));

            if (estado.resultados.size > 0)
                pipeline.hSet(`usuario:${usuario}:resultados`, Object.fromEntries(
                    Array.from(estado.resultados.entries()).map(([k, v]) => [k, String(v)])
                ));

            if (estado.lenguajesConteo.size > 0)
                pipeline.hSet(`usuario:${usuario}:lenguajes`, Object.fromEntries(
                    Array.from(estado.lenguajesConteo.entries()).map(([k, v]) => [k, String(v)])
                ));

            if (estado.lenguajesAC.size > 0)
                pipeline.hSet(`usuario:${usuario}:lenguajesAC`, Object.fromEntries(
                    Array.from(estado.lenguajesAC.entries()).map(([k, v]) => [k, String(v)])
                ));

            for (const [lenguaje, problemas] of estado.lenguajesProblemasResueltos)
                if (problemas.size > 0)
                    pipeline.sAdd(`usuario:${usuario}:lenguaje:${lenguaje}`, Array.from(problemas));

            for (const [timestamp, cantidad] of estado.diasValor) {
                pipeline.hSet(`usuario:${usuario}:diasValor`, String(timestamp), String(cantidad));
                pipeline.zAdd(`usuario:${usuario}:dias`, [{ score: timestamp, value: String(timestamp) }]);
                pipeline.sAdd(`timestamp:${timestamp}`, usuario);
            }
        }

        await pipeline.exec();
    }

    /**
     * Devuelve el conteo de cada resultado del usuario ordenado alfabeticamente.
     * @param usuario - Identificador del usuario.
     * @returns Array de pares `{ name, value }` ordenado por nombre.
     */
    public async getResultados(usuario: string): Promise<{ name: string, value: number }[]> {
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
    public async getLenguajes(usuario: string): Promise<{ name: string, value: number }[]> {
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
    public async getEnviosUsuario(usuario: string, timeIni: number, timeFin: number) {

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
    public async getUltimoEnvioUsuario(usuario: string): Promise<number> {
        const fechaStr = await this.redis.get(`usuario:${usuario}:fechaUltimoEnvio`);
        return fechaStr ? Number(fechaStr) : 0;
    }

    /**
     * Elimina de Redis todos los registros de envios del dia indicado.
     * @param timeStamp - Timestamp en segundos correspondiente al dia a eliminar.
     */
    public async eliminarEnviosDia(timeStamp: number) {

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
    public async getNumEnvios(usuario: string): Promise<number> {
        const enviosStr = await this.redis.get(`usuario:${usuario}:envios`);
        const envios = enviosStr ? Number(enviosStr) : 0;
        return envios;
    }

    /**
     * Devuelve el numero de problemas resueltos correctamente por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de problemas con resultado AC.
     */
    public async getNumProblemasResueltos(usuario: string): Promise<number> {
        const numProblemasResueltos = await this.redis.sCard(`usuario:${usuario}:problemasAC`);
        return numProblemasResueltos;
    }

    /**
     * Devuelve el listado de identificadores de problemas resueltos por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Array con los identificadores de los problemas resueltos.
     */
    public async getProblemasResueltos(usuario: string): Promise<string[]> {
        return await this.redis.sMembers(`usuario:${usuario}:problemasAC`);
    }

    /**
     * Devuelve el numero de problemas resueltos por el usuario usando el lenguaje indicado.
     * @param usuario - Identificador del usuario.
     * @param lenguaje - Nombre del lenguaje de programacion.
     * @returns Numero de problemas resueltos con ese lenguaje.
     */
    public async getNumProblemasLenguaje(usuario: string, lenguaje: string): Promise<number> {
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
    public async getProblemasLenguaje(usuario: string, lenguaje: string): Promise<string[]> {
        return await this.redis.sMembers(`usuario:${usuario}:lenguaje:${lenguaje}`);
    }

    /**
     * Devuelve el numero de lenguajes distintos usados por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de lenguajes distintos.
     */
    public async getNumLenguajesUsados(usuario: string): Promise<number> {
        const numLenguajes = await this.redis.hLen(`usuario:${usuario}:lenguajes`);
        return numLenguajes;
    }

    /**
     * Devuelve la racha maxima de envios correctos consecutivos del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Longitud de la racha maxima de envios correctos.
     */
    public async getRachaEnviosCorrectos(usuario: string): Promise<number> {
        const rachaStr = await this.redis.get(`usuario:${usuario}:rachaEnviosACMax`);
        const racha = rachaStr ? Number(rachaStr) : 0;
        return racha;
    }

    /**
     * Devuelve la racha maxima de dias consecutivos con envios del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Longitud de la racha maxima de dias consecutivos.
     */
    public async getRachaDiasEnviosConsecutivos(usuario: string): Promise<number> {
        const rachaStr = await this.redis.get(`usuario:${usuario}:rachaDiasEnvioMax`);
        const racha = rachaStr ? Number(rachaStr) : 0;
        return racha;
    }

    /**
     * Devuelve el numero de categorias distintas de problemas resueltos por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de categorias distintas.
     */
    public async getNumCategoriasProblemasResueltos(usuario: string): Promise<number> {
        const numCategorias = await this.redis.sCard(`usuario:${usuario}:categoriasAC`);
        return numCategorias;
    }

    /**
     * Devuelve el listado de horas del dia (0-23) en las que el usuario ha hecho envios.
     * @param usuario - Identificador del usuario.
     * @returns Array de horas sin repeticion.
     */
    public async getHoras(usuario: string): Promise<number[]> {
        const horas = await this.redis.sMembers(`usuario:${usuario}:horas`);
        const valorHoras = horas.map(hora => Number(hora));
        return valorHoras;
    }

    /**
     * Devuelve el conteo de envios AC por lenguaje del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Array de pares `{ name, value }`.
     */
    public async getLenguajesAC(usuario: string): Promise<{ name: string, value: number }[]> {
        const datos = await this.redis.hGetAll(`usuario:${usuario}:lenguajesAC`);
        return Object.entries(datos).map(([name, value]) => ({ name, value: Number(value) }));
    }

    /**
     * Devuelve el conteo de envios por dia del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Array de pares `{ timestamp, value }`.
     */
    public async getDiasValor(usuario: string): Promise<{ timestamp: number, value: number }[]> {
        const datos = await this.redis.hGetAll(`usuario:${usuario}:diasValor`);
        return Object.entries(datos).map(([timestamp, value]) => ({ timestamp: Number(timestamp), value: Number(value) }));
    }

    async existeUsuario(usuario: string): Promise<boolean> {
        const existe = await this.redis.sIsMember("usuarios", usuario);
        return existe === 1;
    }
}

export default new UsuarioDAO();