import DAO from "./DAO.js";
import { EstadoUsuario } from "../types/estados/estadoUsuario.js";
import { borrarPatrones } from "./borrarPatrones.js";
import { Pipeline } from "./DAO.js"

class UsuarioDAO extends DAO {

    //============================== PIPELINE ==============================

    /**
     * Crea un nuevo pipeline (transaccion MULTI) de Redis para batchear escrituras.
     * @returns Pipeline listo para acumular comandos antes de ejecutar con `exec()`.
     */
    public iniciarPipeline(): Pipeline {
        return this.redis.multi();
    }

    //============================== REGISTRO DE USUARIO ==============================

    /**
     * Anade el identificador del usuario al indice global de usuarios.
     * @param pipeline - Pipeline donde encolar el comando.
     * @param usuario - Identificador del usuario.
     */
    public guardarUsuario(pipeline: Pipeline, usuario: string): void {
        pipeline.zAdd(`usuarios`, { score: 0, value: usuario });
    }

    //============================== GUARDAR CAMPOS ==============================

    /**
     * Encola en el pipeline el guardado del numero de envios del usuario.
     * @param pipeline - Pipeline donde encolar los comandos.
     * @param usuario - Identificador del usuario.
     * @param estado - Estado del usuario con el campo `numEnvios`.
     */
    public guardarEnvios(pipeline: Pipeline, usuario: string, estado: EstadoUsuario): void {
        pipeline.set(`usuario:${usuario}:envios`, String(estado.numEnvios));
    }

    /**
     * Encola en el pipeline el guardado de las rachas del usuario (envios AC y dias).
     * @param pipeline - Pipeline donde encolar los comandos.
     * @param usuario - Identificador del usuario.
     * @param estado - Estado del usuario con los campos de racha.
     */
    public guardarRachas(pipeline: Pipeline, usuario: string, estado: EstadoUsuario): void {
        pipeline.set(`usuario:${usuario}:fechaUltimoEnvio`, String(estado.ultimoDiaEnvio));
        pipeline.set(`usuario:${usuario}:rachaEnviosAC`,    String(estado.rachaEnviosAC));
        pipeline.set(`usuario:${usuario}:rachaEnviosACMax`, String(estado.rachaEnviosACMax));
        pipeline.set(`usuario:${usuario}:rachaDiasEnvio`,   String(estado.rachaDiasEnvio));
        pipeline.set(`usuario:${usuario}:rachaDiasEnvioMax`,String(estado.rachaDiasEnvioMax));
    }

    /**
     * Encola en el pipeline el guardado del set de problemas resueltos por el usuario.
     * @param pipeline - Pipeline donde encolar los comandos.
     * @param usuario - Identificador del usuario.
     * @param estado - Estado del usuario con el campo `problemasAC`.
     */
    public guardarProblemas(pipeline: Pipeline, usuario: string, estado: EstadoUsuario): void {
        if (estado.problemasAC!.size > 0)
            pipeline.sAdd(`usuario:${usuario}:problemasAC`, Array.from(estado.problemasAC!));
    }

    /**
     * Encola en el pipeline el guardado de las horas del dia en las que el usuario ha enviado.
     * @param pipeline - Pipeline donde encolar los comandos.
     * @param usuario - Identificador del usuario.
     * @param estado - Estado del usuario con el campo `horas`.
     */
    public guardarHoras(pipeline: Pipeline, usuario: string, estado: EstadoUsuario): void {
        if (estado.horas!.size > 0)
            pipeline.sAdd(`usuario:${usuario}:horas`, Array.from(estado.horas!).map(String));
    }

    /**
     * Encola en el pipeline el guardado del conteo de resultados del usuario.
     * @param pipeline - Pipeline donde encolar los comandos.
     * @param usuario - Identificador del usuario.
     * @param estado - Estado del usuario con el campo `resultados`.
     */
    public guardarResultados(pipeline: Pipeline, usuario: string, estado: EstadoUsuario): void {
        const datos: Record<string, string> = {};
        for (const [k, v] of estado.resultados!)
            datos[k] = String(v);
        if (Object.keys(datos).length > 0)
            pipeline.hSet(`usuario:${usuario}:resultados`, datos);
    }

    /**
     * Encola en el pipeline el guardado de los conteos de lenguajes, lenguajes AC
     * y problemas resueltos por lenguaje del usuario.
     * @param pipeline - Pipeline donde encolar los comandos.
     * @param usuario - Identificador del usuario.
     * @param estado - Estado del usuario con los campos de lenguajes.
     */
    public guardarLenguajes(pipeline: Pipeline, usuario: string, estado: EstadoUsuario): void {
        const conteo: Record<string, string> = {};
        for (const [k, v] of estado.lenguajesConteo!)
            conteo[k] = String(v);
        if (Object.keys(conteo).length > 0)
            pipeline.hSet(`usuario:${usuario}:lenguajes`, conteo);

        const ac: Record<string, string> = {};
        for (const [k, v] of estado.lenguajesAC!)
            ac[k] = String(v);
        if (Object.keys(ac).length > 0)
            pipeline.hSet(`usuario:${usuario}:lenguajesAC`, ac);

        for (const [lenguaje, problemas] of estado.lenguajesProblemasResueltos!) {
            if (problemas.size > 0)
                pipeline.sAdd(`usuario:${usuario}:lenguaje:${lenguaje}`, Array.from(problemas));
        }
    }

    /**
     * Encola en el pipeline el guardado del historial de envios por dia del usuario,
     * actualizando los indices auxiliares de timestamps.
     * @param pipeline - Pipeline donde encolar los comandos.
     * @param usuario - Identificador del usuario.
     * @param estado - Estado del usuario con el campo `diasValor`.
     */
    public guardarDiasValor(pipeline: Pipeline, usuario: string, estado: EstadoUsuario): void {
        for (const [ts, cantidad] of estado.diasValor!) {
            pipeline.hSet(`usuario:${usuario}:diasValor`, String(ts), String(cantidad));
            pipeline.zAdd(`usuario:${usuario}:dias`, [{ score: ts, value: String(ts) }]);
            pipeline.sAdd(`timestamp:${ts}`, String(usuario));
            pipeline.zAdd(`timestamps`, [{ score: ts, value: String(ts) }]);
        }
    }

    //============================== GUARDAR CAMPOS POR MES ==============================

    /**
     * Encola en el pipeline el incremento del numero de envios del usuario en el mes indicado.
     * @param pipeline - Pipeline donde encolar el comando.
     * @param usuario - Identificador del usuario.
     * @param mes - Mes (0-11) al que pertenece el incremento.
     * @param enviosNuevos - Numero de envios a sumar al contador del mes.
     */
    public registrarNumEnviosMes(pipeline: Pipeline, usuario: string, mes: number, enviosNuevos: number): void {
        pipeline.zIncrBy(`usuario:numEnvios:mes:${mes}`, enviosNuevos, usuario);
    }

    /**
     * Encola en el pipeline el guardado de los problemas resueltos con AC por el usuario en el mes indicado.
     * @param pipeline - Pipeline donde encolar el comando.
     * @param usuario - Identificador del usuario.
     * @param mes - Mes (0-11) al que pertenecen los problemas.
     * @param nuevos - Lista de identificadores de problema resueltos en ese mes.
     */
    public registrarProblemasACMes(pipeline: Pipeline, usuario: string, mes: number, nuevos: string[]): void {
        pipeline.sAdd(`usuario:${usuario}:problemasAC:mes:${mes}`, nuevos);
    }

    //============================== BORRAR CAMPOS ==============================

    /**
     * Borra de Redis las claves del numero de envios de todos los usuarios.
     */
    public async borrarEnvios(): Promise<void> {
        await borrarPatrones(['usuario:*:envios']);
    }

    /**
     * Borra de Redis las claves de rachas (envios AC y dias) de todos los usuarios.
     */
    public async borrarRachas(): Promise<void> {
        await borrarPatrones([
            'usuario:*:fechaUltimoEnvio',
            'usuario:*:rachaEnviosAC',
            'usuario:*:rachaEnviosACMax',
            'usuario:*:rachaDiasEnvio',
            'usuario:*:rachaDiasEnvioMax',
        ]);
    }

    /**
     * Borra de Redis las claves de problemas resueltos de todos los usuarios.
     */
    public async borrarProblemas(): Promise<void> {
        await borrarPatrones(['usuario:*:problemasAC']);
    }

    /**
     * Borra de Redis las claves de horas de envios de todos los usuarios.
     */
    public async borrarHoras(): Promise<void> {
        await borrarPatrones(['usuario:*:horas']);
    }

    /**
     * Borra de Redis las claves del conteo de resultados de todos los usuarios.
     */
    public async borrarResultados(): Promise<void> {
        await borrarPatrones(['usuario:*:resultados']);
    }

    /**
     * Borra de Redis las claves de lenguajes (conteo, AC y problemas por lenguaje) de todos los usuarios.
     */
    public async borrarLenguajes(): Promise<void> {
        await borrarPatrones([
            'usuario:*:lenguajes',
            'usuario:*:lenguajesAC',
            'usuario:*:lenguaje:*',
        ]);
    }

    /**
     * Borra de Redis las claves del historial de envios por dia de todos los usuarios.
     */
    public async borrarDiasValor(): Promise<void> {
        await borrarPatrones(['usuario:*:diasValor', 'usuario:*:dias']);
    }

    ////============================== MODIFICADORES ==============================

    /**
     * Elimina de Redis todos los registros de envios del dia indicado y anteriores.
     * @param timeStamp - Timestamp en segundos del dia mas reciente a eliminar.
     */
    public async eliminarEnviosAnterioresDia(timeStamp: number) {

        //se sacan todos lo dias registrados hasta el dia indicado
        const timestamps = (await this.redis.zRange(`timestamps`, '-inf', timeStamp, { BY: 'SCORE' })).map(Number);

        const pipeline = this.redis.multi();

        //se itera por los timestamps y se eliminan los datos del usuario y las datos auxiliares
        for (const ts of timestamps) {
            await this.eliminarEnviosDia(ts, pipeline);
            pipeline.del(`timestamp:${ts}`);
            pipeline.zRem(`timestamps`, String(ts));
        }

        await pipeline.exec();
    }

    private async eliminarEnviosDia(timeStamp: number, pipeline: ReturnType<typeof this.redis.multi>) {

        //se sacan los usuarios que hicieron envios en ese dia
        const usuarios: string[] = await this.redis.sMembers(`timestamp:${timeStamp}`);

        for (const usuario of usuarios) {
            pipeline.zRem(`usuario:${usuario}:dias`, String(timeStamp));
            pipeline.hDel(`usuario:${usuario}:diasValor`, String(timeStamp));
        }

        console.log(` - Eliminados envios del dia ${timeStamp}`);
    }

    //============================== CONSULTAS ==============================
    
    /**
     * Devuelve si el usuario usuario existe.
     * @param usuario - Identificador del usuario.
     * @returns true si existe y false si no.
     */
    async existeUsuario(usuario: string): Promise<boolean> {
        const score = await this.redis.zScore("usuarios", usuario);
        return score !== null;
    }

    /**
     * Devuelve los usuarios cuyo nombre (nick) comienzan por el string patron.
     * @param patron - String.
     * @returns Array con los nombres de los usuarios`.
     */
    /**
     * Devuelve todos los usuarios registrados.
     * @returns Array con los nombres de todos los usuarios.
     */
    async getTodosUsuarios(): Promise<string[]> {
        return await this.redis.zRange(`usuarios`, 0, -1);
    }

    async getUsuariosSugeridos(patron: string): Promise<string[]> {
        const usuarios = await this.redis.zRangeByLex(`usuarios`, `[${patron}`, `[${patron}\xff`);
        return usuarios;
    }

    /**
     * Devuelve los envios dentro de un periodo de tiempo.
     * @param usuario - usuario del que se quiero hacer la consulta.
     * @param timeIni - timestamp en segundos de la hora 00:00 del primero dia del intervalo.
     * @param timeFin - timestamp en segundos de la hora 00:00 del ultimo dia del intervalo.                 
     * @returns - un array con tantos elementos {timestamp:number, value:number} como dias en el intervalo.
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
     * Devuelve el numero total de envios del usuario, o 0 si no tiene ninguno.
     * @param usuario - Identificador del usuario.
     * @returns Numero de envios.
     */
    public async getNumEnvios(usuario: string): Promise<number> {
        const enviosStr = await this.redis.get(`usuario:${usuario}:envios`);
        const envios = enviosStr ? Number(enviosStr) || 0 : 0;
        return envios;
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
     * Devuelve la racha actual de envios correctos consecutivos del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Longitud de la racha actual de envios correctos consecutivos.
     */
    public async getRachaEnviosCorrectosActual(usuario: string): Promise<number> {
        const rachaStr = await this.redis.get(`usuario:${usuario}:rachaEnviosAC`);
        const racha = rachaStr ? Number(rachaStr) : 0;
        return racha;
    }

    /**
     * Devuelve la racha maxima de envios correctos consecutivos del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Longitud de la racha maxima de envios correctos.
     */
    public async getRachaEnviosCorrectosMax(usuario: string): Promise<number> {
        const rachaStr = await this.redis.get(`usuario:${usuario}:rachaEnviosACMax`);
        const racha = rachaStr ? Number(rachaStr) : 0;
        return racha;
    }

    /**
     * Devuelve la racha actual de dias consecutivos con envios del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Longitud de la racha actual de dias consecutivos con envios.
     */
    public async getRachaDiasEnviosConsecutivosActual(usuario: string): Promise<number> {
        const rachaStr = await this.redis.get(`usuario:${usuario}:rachaDiasEnvio`);
        const racha = rachaStr ? Number(rachaStr) : 0;
        return racha;
    }

    /**
     * Devuelve la racha maxima de dias consecutivos con envios del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Longitud de la racha maxima de dias consecutivos.
     */
    public async getRachaDiasEnviosConsecutivosMax(usuario: string): Promise<number> {
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
    
    /**
     * Devuelve la racha actual de envios correctos consecutivos del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Longitud de la racha maxima de envios correctos.
     */
    public async getRachaActualEnviosCorrectos(usuario: string): Promise<number> {
        const rachaStr = await this.redis.get(`usuario:${usuario}:rachaEnviosAC`);
        const racha = rachaStr ? Number(rachaStr) : 0;
        return racha;
    }

    /**
     * Devuelve la racha actual de dias consecutivos con envios del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Longitud de la racha actual de dias consecutivos.
     */
    public async getRachaActualDiasEnviosConsecutivos(usuario: string): Promise<number> {
        const rachaStr = await this.redis.get(`usuario:${usuario}:rachaDiasEnvio`);
        const racha = rachaStr ? Number(rachaStr) : 0;
        return racha;
    }
}

export default new UsuarioDAO();