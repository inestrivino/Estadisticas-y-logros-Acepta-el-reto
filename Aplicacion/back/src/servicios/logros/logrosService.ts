import { EstadoUsuario } from "../../types/estados/estadoUsuario.js";
import { EstadoProblema } from "../../types/estados/estadoProblema.js";
import logrosDAO from "../../dao/logrosDAO.js";
import { datosLogro } from "../../types/datos/datosLogro.js";
import { EnvioProcesado } from "../../types/envios/envioProcesado.js";
import { Logro } from "./definiciones/logro.js";

import { logrosOnboarding } from "./definiciones/onboarding/index.js";
import { logrosProblemas } from "./definiciones/problemas/index.js";
import { logrosLenguajes } from "./definiciones/lenguajes/index.js";
import { logrosRachas } from "./definiciones/rachas/index.js";
import { logrosCalidad } from "./definiciones/calidad/index.js";

class LogrosService {

    private nuevosPorUsuario = new Map<string, Set<string>>();

    //grupos de trofeos que se evaluan de forma independiente
    //para añadir nuevos logros basta con crear un nuevo grupo y añadirlo aqui
    private gruposTrofeos: Logro[][] = [
        logrosOnboarding,
        logrosProblemas,
        logrosLenguajes,
        logrosRachas,
        logrosCalidad,
    ];

    /**
     * Procesa los logros en tiempo real de cada grupo tras un envio
     * y acumula los nuevos en nuevosPorUsuario.
     * @param estadoUsuario - Estado actual del usuario.
     * @param estadoProblema - Estado actual del problema.
     * @param envio - Envio que desencadena la evaluacion.
     */
    public procesarEstado(estadoUsuario: EstadoUsuario, estadoProblema: EstadoProblema, envio: EnvioProcesado) {

        //se evalua cada grupo de trofeos en tiempo real
        //TODO poner aqui que solo se procesen los grupos que se necesiten segun el numero de envio
        //y al principio del inicializar se mira si cambio el numero de version para poner el numero del envio a 1
        const nuevos: string[] = [];
        for (const grupo of this.gruposTrofeos)
            for (const logro of this.comprobarLogros(grupo, true, estadoUsuario, estadoProblema, envio))
                nuevos.push(logro);

        if (nuevos.length === 0)
            return;

        //se acumulan los nuevos logros para este usuario
        if (!this.nuevosPorUsuario.has(envio.usuario))
            this.nuevosPorUsuario.set(envio.usuario, new Set());

        for (const trofeo of nuevos)
            this.nuevosPorUsuario.get(envio.usuario)?.add(trofeo);
    }

    /**
     * Procesa los logros de estado global de cada grupo para cada usuario y persiste los nuevos en Redis.
     * @param usuarios - Conjunto de identificadores de usuario a evaluar.
     * @param estadosUsuarios - Mapa con el estado final de cada usuario.
     * @param estadosProblemas - Mapa con el estado final de cada problema (no usado actualmente, reservado para futuros logros).
     */
    public async cargarTrofeos(
        usuarios: Set<string>,
        estadosUsuarios: Map<string, EstadoUsuario>,
        estadosProblemas: Map<string, EstadoProblema>
    ) {

        for (const usuario of usuarios) {

            const estadoUsuario = estadosUsuarios.get(usuario) as EstadoUsuario;

            //se evalua cada grupo de trofeos de estado global
            for (const grupo of this.gruposTrofeos) {
                const nuevos = this.comprobarLogros(grupo, false, estadoUsuario);

                if (nuevos.length === 0)
                    continue;

                if (!this.nuevosPorUsuario.has(usuario))
                    this.nuevosPorUsuario.set(usuario, new Set());

                for (const trofeo of nuevos)
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
     * Comprueba que logros de un grupo cumple el usuario y los marca como obtenidos.
     * @returns Nombres de los logros recien obtenidos por el usuario.
     */
    private comprobarLogros(
        grupo: Logro[],
        enTiempoReal: boolean,
        estadoUsuario: EstadoUsuario,
        estadoProblema?: EstadoProblema,
        envio?: EnvioProcesado
    ): string[] {

        const nuevos: string[] = [];

        for (const logro of grupo) {
            //se omiten los logros que no son del modo evaluado
            if (logro.enTiempoReal !== enTiempoReal)
                continue;

            //se omiten los logros que el usuario ya tiene
            if (estadoUsuario.logros.has(logro.nombre))
                continue;

            if (logro.condicion(estadoUsuario, estadoProblema, envio)) {
                estadoUsuario.logros.add(logro.nombre);
                nuevos.push(logro.nombre);
            }
        }

        return nuevos;
    }

    /**
     * Devuelve todos los logros indicando si el usuario los tiene o no, agrupados segun la clasificacion.
     * @param usuario - Identificador del usuario.
     * @param clasificacion - Criterio de agrupacion: `"nivel"` o `"categoria"`.
     * @returns Objeto con la clasificacion y los grupos de logros.
     */
    public async getLogrosUsuario(usuario: string, clasificacion: string) {
        const setLogros = new Set(await logrosDAO.getLogros(usuario));

        //agrega el atributo de si el usuario tiene ese logro o no
        const todosLosLogros = this.gruposTrofeos.flat();
        const logrosUsuario = todosLosLogros.map(logro => ({
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
     * Busca un logro por su nombre recorriendo todos los grupos de trofeos.
     * @param logro - Nombre del logro a buscar.
     * @returns El logro encontrado, o `undefined` si no existe.
     */
    public getLogroByName(logro: string): Logro | undefined {
        for (const grupo of this.gruposTrofeos) {
            const encontrado = grupo.find(l => l.nombre === logro);
            if (encontrado) return encontrado;
        }
        return undefined;
    }
}

export default new LogrosService();
