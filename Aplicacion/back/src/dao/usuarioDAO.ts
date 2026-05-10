import DAO from "./DAO.js";
import { RegistradorUsuario } from "./registradores/usuarioRegistradorInterface.js";
import registradorEnvios from "./registradores/usuarios/enviosRegistrador.js";
import registradorRachas from "./registradores/usuarios/rachasRegistrador.js";
import registradorProblemas from "./registradores/usuarios/problemasRegistrador.js";
import registradorHoras from "./registradores/usuarios/horasRegistrador.js";
import registradorResultados from "./registradores/usuarios/resultadosRegistrador.js";
import registradorLenguajes from "./registradores/usuarios/lenguajesRegistrador.js";
import registradorDiasValor from "./registradores/usuarios/diasValorRegistrador.js";
import { CampoUsuario } from "../types/estados/camposEstadoUsuario.js";
import { EstadoUsuario } from "../types/estados/estadoUsuario.js";

class UsuarioDAO extends DAO {

    //para añadir un nuevo campo basta con crear un nuevo registrador y añadirlo aqui
    private registradores: RegistradorUsuario[] = [
        registradorEnvios,
        registradorRachas,
        registradorProblemas,
        registradorHoras,
        registradorResultados,
        registradorLenguajes,
        registradorDiasValor,
    ];

    /**
     * Persiste en Redis el estado completo de cada usuario del mapa usando un pipeline.
     * Si se indica `statsActivos`, solo se escriben los campos de esos calculadores;
     * si no se indica se escriben todos.
     * @param estadosUsuarios - Mapa de identificador de usuario a su estado final.
     * @param statsActivos - Conjunto opcional de ids de calculadores cuyos campos hay que persistir.
     */
    public async registrarEstadosUsuarios(estadosUsuarios: Map<string, EstadoUsuario>): Promise<void> {
        const pipeline = this.redis.multi();

        for (const [usuario, estado] of estadosUsuarios) {
            for (const { id, registrar } of this.registradores)
                if (estado[id] !== undefined)
                    registrar(pipeline, usuario, estado);
            
            pipeline.zAdd(`usuarios`, { score: 0, value: usuario });
         }       
        await pipeline.exec();
    }

    /**
     * Borra todos los datos de Redis de los registradores cuyos ids se indiquen.
     * @param ids - Conjunto de ids de registradores cuyos datos hay que borrar.
     */
    public async borrarEstados(ids: Set<string>): Promise<void> {
        for (const registrador of this.registradores)
            if (ids.has(registrador.id))
                await registrador.borrar();
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
}

export default new UsuarioDAO();