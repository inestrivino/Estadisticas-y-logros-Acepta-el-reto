import usuarioDAO from '../dao/usuarioDAO.js';
import { EstadoUsuario } from '../types/estados/estadoUsuario.js';
import { RegistradorUsuario } from './registradores/usuarioRegistrador.js';
import registradorEnvios from './registradores/usuarios/enviosRegistrador.js';
import registradorRachas from './registradores/usuarios/rachasRegistrador.js';
import registradorProblemas from './registradores/usuarios/problemasRegistrador.js';
import registradorHoras from './registradores/usuarios/horasRegistrador.js';
import registradorResultados from './registradores/usuarios/resultadosRegistrador.js';
import registradorLenguajes from './registradores/usuarios/lenguajesRegistrador.js';
import registradorDiasValor from './registradores/usuarios/diasValorRegistrador.js';

class UsuarioService {

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
     * Solo se escriben los campos definidos en el estado (los `undefined` se omiten).
     * @param estadosUsuarios - Mapa de identificador de usuario a su estado final.
     */
    async registrarEstadosUsuarios(estadosUsuarios: Map<string, EstadoUsuario>): Promise<void> {
        const pipeline = usuarioDAO.iniciarPipeline();

        for (const [usuario, estado] of estadosUsuarios) {
            for (const { id, registrar } of this.registradores)
                if (estado[id] !== undefined)
                    registrar(pipeline, usuario, estado);

            usuarioDAO.guardarUsuario(pipeline, usuario);
        }

        await pipeline.exec();
    }

    /**
     * Borra los campos de los registradores indicados para cada usuario.
     * @param ids - Conjunto de ids de registradores cuyos campos hay que borrar.
     */
    async resetearCamposUsuarios(ids: Set<string>): Promise<void> {
        for (const registrador of this.registradores)
            if (ids.has(registrador.id))
                await registrador.borrar();
    }
    
    /**
     * Elimina de Redis los envios con mas de un anio de antiguedad.
     */
    public async eliminarEnviosAntiguos() {
        //se saca el timeStamp del inicio del dia en el que se hizo la consulta
        const hoy = new Date;
        hoy.setHours(0, 0, 0, 0);
        const hoyTimestamp = hoy.valueOf() / 1000;

        const anioTimestamp = hoyTimestamp - 365 * 24 * 60 * 60;

        await usuarioDAO.eliminarEnviosAnterioresDia(anioTimestamp);
    }

    //============================== CONSULTAS ==============================

    /**
     * Devuelve los envios del ultimo anio del usuario
     * @param usuario - usuario del que se quiero hacer la consulta               
     * @returns - un array con tantos elementos {timestamp:number, value:number} como dias en el intervalo
     */
    public async getEnviosAnio(usuario: string) {
        //se saca el timeStamp del inicio del dia en el que se hizo la consulta
        const hoy = new Date;
        hoy.setHours(0, 0, 0, 0);
        const timeFin = hoy.valueOf() / 1000;

        const timeIni = timeFin - 364 * 24 * 60 * 60;

        const datos = await usuarioDAO.getEnviosUsuario(usuario, timeIni, timeFin);

        return datos;
    }
    
    /**
     * Devuelve si el usuario existe en la bd o no.
     * @param usuario - Identificador del usuario.
     */
    public async existeUsuario(usuario: string): Promise<boolean> {
        const u = usuario.toLowerCase().normalize("NFC").trim();
        return await usuarioDAO.existeUsuario(u);
    }
    
    /**
     * Devuelve todos los usuarios registrados.
     * @returns Array con los nombres de todos los usuarios.
     */
    async getTodosUsuarios(): Promise<string[]> {
        return await usuarioDAO.getTodosUsuarios();
    }

    /**
     * Devuelve los usuarios cuyo nombre (nick) comienzan por el string patron.
     * @param patron - String.
     * @returns Array con los nombres de los usuarios`.
     */
    public async getUsuariosSugeridos(patron: string): Promise<string[]> {
        const p = patron.toLowerCase().normalize("NFC").trim();
        return usuarioDAO.getUsuariosSugeridos(p);
    }
    
    /**
     * Devuelve el conteo de cada resultado del usuario ordenado alfabeticamente.
     * @param usuario - Identificador del usuario.
     * @returns Array de pares `{ name, value }`.
     */
    public async getResultados(usuario: string) {
        return await usuarioDAO.getResultados(usuario);
    }

    /**
     * Devuelve el conteo de envios por lenguaje del usuario ordenado alfabeticamente.
     * @param usuario - Identificador del usuario.
     * @returns Array de pares `{ name, value }`.
     */
    public async getLenguajes(usuario: string) {
        return await usuarioDAO.getLenguajes(usuario);
    }

    /**
     * Devuelve el numero total de envios del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de envios.
     */
    async getNumEnvios(usuario: string): Promise<number> {
        return usuarioDAO.getNumEnvios(usuario);
    }

    /**
     * Devuelve el numero de problemas distintos resueltos por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de problemas resueltos.
     */
    async getNumProblemasResueltos(usuario: string): Promise<number> {
        return usuarioDAO.getNumProblemasResueltos(usuario);
    }

    /**
     * Devuelve el numero de problemas resueltos por el usuario en un lenguaje concreto.
     * @param usuario - Identificador del usuario.
     * @param lenguaje - Lenguaje de programacion a filtrar.
     * @returns Numero de problemas resueltos en ese lenguaje.
     */
    async getNumProblemasLenguaje(usuario: string, lenguaje: string): Promise<number> {
        return usuarioDAO.getNumProblemasLenguaje(usuario, lenguaje);
    }

    /**
     * Devuelve los identificadores de los problemas resueltos por el usuario en un lenguaje concreto.
     * @param usuario - Identificador del usuario.
     * @param lenguaje - Lenguaje de programacion a filtrar.
     * @returns Array con los identificadores de los problemas resueltos en ese lenguaje.
     */
    async getProblemasLenguaje(usuario: string, lenguaje: string): Promise<string[]> {
        return usuarioDAO.getProblemasLenguaje(usuario, lenguaje);
    }

    /**
     * Devuelve el numero de lenguajes distintos que ha usado el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de lenguajes usados.
     */
    async getNumLenguajesUsados(usuario: string): Promise<number> {
        return usuarioDAO.getNumLenguajesUsados(usuario);
    }

    /**
     * Devuelve el numero de categorias distintas de problemas resueltos por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de categorias resueltas.
     */
    async getNumCategoriasProblemasResueltos(usuario: string): Promise<number> {
        return usuarioDAO.getNumCategoriasProblemasResueltos(usuario);
    }

    /**
     * Devuelve los identificadores de los problemas resueltos por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Array de identificadores de problemas.
     */
    async getProblemasResueltos(usuario: string): Promise<string[]> {
        return usuarioDAO.getProblemasResueltos(usuario);
    }

    /**
     * Devuelve la racha actual de envios correctos consecutivos del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de envios correctos consecutivos.
     */
    async getRachaEnviosCorrectos(usuario: string): Promise<number> {
        return usuarioDAO.getRachaEnviosCorrectos(usuario);
    }

    /**
     * Devuelve la racha actual de dias consecutivos con al menos un envio del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de dias consecutivos con envio.
     */
    async getRachaDiasEnviosConsecutivos(usuario: string): Promise<number> {
        return usuarioDAO.getRachaDiasEnviosConsecutivos(usuario);
    }

    /**
     * Devuelve el timestamp del ultimo envio realizado por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Timestamp Unix del ultimo envio.
     */
    async getUltimoEnvioUsuario(usuario: string): Promise<number> {
        return usuarioDAO.getUltimoEnvioUsuario(usuario);
    }

    /**
     * Devuelve el histograma de horas del dia en las que el usuario ha realizado envios.
     * @param usuario - Identificador del usuario.
     * @returns Array de 24 posiciones con el conteo de envios por hora.
     */
    async getHoras(usuario: string): Promise<number[]> {
        return usuarioDAO.getHoras(usuario);
    }

    /**
     * Devuelve el conteo de envios aceptados por lenguaje del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Array de pares `{ name, value }`.
     */
    async getLenguajesAC(usuario: string): Promise<{ name: string, value: number }[]> {
        return usuarioDAO.getLenguajesAC(usuario);
    }

    /**
     * Devuelve el numero de envios agrupados por dia para el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Array de pares `{ timestamp, value }` con un elemento por dia.
     */
    async getDiasValor(usuario: string): Promise<{ timestamp: number, value: number }[]> {
        return usuarioDAO.getDiasValor(usuario);
    }

    async getRachaActualEnviosCorrectos(usuario: string): Promise<number> {
        return usuarioDAO.getRachaActualEnviosCorrectos(usuario);
    }

    /**
     * Devuelve la racha actual de dias consecutivos con al menos un envio del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de dias consecutivos actuales con envio.
     */
    async getRachaActualDiasEnviosConsecutivos(usuario: string): Promise<number> {
        return usuarioDAO.getRachaActualDiasEnviosConsecutivos(usuario);
    }

}

export default new UsuarioService();