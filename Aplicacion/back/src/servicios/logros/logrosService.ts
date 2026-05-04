import { logros } from "./definiciones/logro.js";
import { EstadoUsuario } from "../../types/estadoUsuario.js";
import { EstadoProblema } from "../../types/estadoProblema.js";
import logrosDAO from "../../dao/logrosDAO.js";
import { datosLogro } from "../../types/datosLogro.js";
import { EnvioProcesado } from "../../types/envioProcesado.js";
import { Logro } from "../../types/logro.js";

class LogrosService {

    private nuevosPorUsuario = new Map<string, Set<string>>();

    /**
     * Devuelve todos los logros indicando si el usuario los tiene o no, agrupados segun la clasificacion.
     * @param usuario - Identificador del usuario.
     * @param clasificacion - Criterio de agrupacion: `"nivel"` o `"categoria"`.
     * @returns Objeto con la clasificacion y los grupos de logros.
     */
    public async getLogrosUsuario(usuario: string, clasificacion: string) {
        const setLogros = new Set(await logrosDAO.getLogros(usuario.toLowerCase().normalize("NFC").trim()));

        //agrega el atributo de si el usuario tiene ese logro o no
        const logrosUsuario = logros.map(logro => ({
            nombre: logro.nombre,
            descripcion: logro.descripcion,
            imagen: logro.imagen,
            nivel: logro.nivel,
            categoria: logro.categoria,
            sorpresa: logro.sorpresa,
            obtenido: setLogros.has(logro.nombre)
        }));

        //agrupa todos los logros segun la clasificacion seleccionada
        const gruposMap = new Map();
        for (const logro of logrosUsuario) {
            const key = clasificacion === "nivel" ? logro.nivel : logro.categoria;
            if (!gruposMap.has(key))
                gruposMap.set(key, []);
            gruposMap.get(key).push(logro);
        }

        const grupos = Array.from(gruposMap.entries()).map(([grupo, logros]) => ({ grupo, logros }));
        return { clasificacion, grupos };
    }

    /**
     * Devuelve los identificadores de los logros obtenidos por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Array con los nombres de los logros obtenidos.
     */
    public async getLogros(usuario: string): Promise<string[]> {
        return logrosDAO.getLogros(usuario);
    }

    /**
     * Busca un logro por su nombre.
     * @param logro - Nombre del logro a buscar.
     * @returns El logro encontrado, o `undefined` si no existe.
     */
    public getLogroByName(logro: string): Logro | undefined {
        return logros.find(l => l.nombre === logro);
    }

    /**
     * Comprueba los logros en tiempo real tras un envio y acumula los nuevos en nuevosPorUsuario.
     * @param estadoUsuario - Estado actual del usuario.
     * @param estadoProblema - Estado actual del problema.
     * @param envio - Envio que desencadena la evaluacion.
     */
    public procesarEstado(estadoUsuario: EstadoUsuario, estadoProblema: EstadoProblema, envio: EnvioProcesado) {

        //se miran con el estado actual si se ha conseguido algun logro
        const nuevos = this.comprobarLogros(true, estadoUsuario, estadoProblema, envio);

        //si no hay un ninguno se vuelve
        if (nuevos.length === 0)
            return;

        //si alguno de los trofeos no lo habia conseguido ya en este bloque se marca como conseguido
        if (!this.nuevosPorUsuario.has(envio.usuario))
            this.nuevosPorUsuario.set(envio.usuario, new Set());

        for (const trofeo of nuevos)
            this.nuevosPorUsuario.get(envio.usuario)?.add(trofeo);
    }

    /**
     * Comprueba los logros de estado global para cada usuario y persiste los nuevos en Redis
     * (estadosProblemas como parametro aunque ahora no se usa por si se necesitara para algun otro logro)
     * @param usuarios - Conjunto de identificadores de usuario a evaluar.
     * @param estadosUsuarios - Mapa con el estado final de cada usuario.
     * @param estadosProblemas - Mapa con el estado final de cada problema.
     */
    public async cargarTrofeos(
        usuarios: Set<string>,
        estadosUsuarios: Map<string, EstadoUsuario>,
        estadosProblemas: Map<string, EstadoProblema>
    ) {

        //se comprueban los logros que no dependen de un envio concreto, sino del estado global del usuario o del problema
        for (const usuario of usuarios) {

            //se saca el estada del usuario del envio
            const estadoUsuario = estadosUsuarios.get(usuario) as EstadoUsuario;
            //y se comprueban los logros, se pone a false porque no dependen del estado del juez
            const nuevos = this.comprobarLogros(false, estadoUsuario);

            if (!this.nuevosPorUsuario.has(usuario))
                this.nuevosPorUsuario.set(usuario, new Set());

            for (const trofeo of nuevos) {
                this.nuevosPorUsuario.get(usuario)?.add(trofeo);
            }
        }

        //se pasan al formato correcto para guardarlos en la base de datos y se guardan
        const datos: datosLogro[] = [];
        for (const [usuario, logros] of this.nuevosPorUsuario)
            datos.push({ usuario, logros: Array.from(logros) });

        //se limpia el mapa de logros nuevos para el siguiente bloque
        this.nuevosPorUsuario.clear();

        //se guardan los logros nuevos en la base de datos
        await logrosDAO.guardarBloqueLogros(datos);
    }

    /**
     * Evalua las condiciones de los logros filtrados por modo y devuelve los que se cumplen por primera vez.
     * @param enTiempoReal - Si `true`, evalua logros por envio; si `false`, logros de estado global.
     * @param estadoUsuario - Estado actual del usuario.
     * @param estadoProblema - Estado actual del problema (solo en modo tiempo real).
     * @param envio - Envio que desencadena la evaluacion (solo en modo tiempo real).
     * @returns Array con los nombres de los logros recien obtenidos.
     */
    private comprobarLogros(enTiempoReal: boolean, estadoUsuario: EstadoUsuario, estadoProblema?: EstadoProblema, envio?: EnvioProcesado): string[] {

        const nuevos: string[] = [];

        //se comprueban los logros enTiempoReal o no dependiendo de esta variable
        const logrosFiltrados = logros.filter(logro => logro.enTiempoReal === enTiempoReal);

        for (const logro of logrosFiltrados) {
            // se omiten los logros que el usuario ya tiene
            if (estadoUsuario.logros.has(logro.nombre))
                continue;

            if (logro.condicion(estadoUsuario, estadoProblema, envio)) {
                estadoUsuario.logros.add(logro.nombre);
                nuevos.push(logro.nombre);
            }
        }

        return nuevos;
    }
}

export default new LogrosService();
