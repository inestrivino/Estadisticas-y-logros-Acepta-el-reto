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
     * Devuelve la lista plana de todas las definiciones de logros registradas.
     */
    public getDefiniciones(): Logro[] {
        return this.gruposTrofeos.flat();
    }

    /**
     * Reevalua un conjunto de logros sin envios contra el estado actual de cada usuario.
     * Solo aplicable a logros que no son en tiempo real y cuyas estadisticas requeridas
     * estan al dia (de lo contrario habria que reprocesar envios).
     * @param logros - Nombres de logros a reevaluar.
     */
    public async reevaluarLogros(logros: Set<string>) {
        //TODO Fase 5
    }

    /**
     * Procesa los logros en tiempo real de cada grupo tras un envio y acumula los nuevos en nuevosPorUsuario.
     * Si se indica `checkpointsLogro`, cada logro solo se evalua si su checkpoint es estrictamente menor
     * que el envioId (los ya procesados anteriormente se omiten).
     */
    public procesarEstado(
        estadoUsuario: EstadoUsuario,
        estadoProblema: EstadoProblema,
        envio: EnvioProcesado,
        checkpointsLogro?: Map<string, number>
    ) {

        //se evalua cada grupo de trofeos en tiempo real, filtrando por checkpoint
        const nuevos: string[] = [];
        for (const grupo of this.gruposTrofeos)
            for (const logro of this.comprobarLogros(grupo, true, estadoUsuario, estadoProblema, envio, checkpointsLogro))
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
     * Si se indica `checkpointsLogro` y `lastEnvioId`, solo se evaluan los logros cuyo checkpoint es
     * menor que el ultimo envio del bloque (los ya evaluados contra estado posterior se omiten).
     */
    public async cargarTrofeos(
        usuarios: Set<string>,
        estadosUsuarios: Map<string, EstadoUsuario>,
        estadosProblemas: Map<string, EstadoProblema>,
        checkpointsLogro?: Map<string, number>,
        lastEnvioId?: number
    ) {

        for (const usuario of usuarios) {

            const estadoUsuario = estadosUsuarios.get(usuario) as EstadoUsuario;

            //se evalua cada grupo de trofeos de estado global, filtrando por checkpoint del bloque
            for (const grupo of this.gruposTrofeos) {
                const nuevos = this.comprobarLogros(grupo, false, estadoUsuario, undefined, undefined, checkpointsLogro, lastEnvioId);

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
     * Para logros en tiempo real se compara el checkpoint con `envio.envioId`,
     * para logros globales se compara con `lastEnvioId` (ultimo envio del bloque).
     * @returns Nombres de los logros recien obtenidos por el usuario.
     */
    private comprobarLogros(
        grupo: Logro[],
        enTiempoReal: boolean,
        estadoUsuario: EstadoUsuario,
        estadoProblema?: EstadoProblema,
        envio?: EnvioProcesado,
        checkpointsLogro?: Map<string, number>,
        lastEnvioId?: number
    ): string[] {

        const nuevos: string[] = [];

        //si no tiene logros se devuelve un array vacio
        if (!estadoUsuario.logros)
            return [];

        for (const logro of grupo) {
            //se omiten los logros que no son del modo evaluado
            if (logro.enTiempoReal !== enTiempoReal)
                continue;

            //se omiten los logros que el usuario ya tiene
            if (estadoUsuario.logros.has(logro.nombre))
                continue;

            //se omiten los logros cuyo checkpoint ya cubre el envio o estado actual
            if (checkpointsLogro) {
                const checkpoint = checkpointsLogro.get(logro.nombre) ?? 0;
                const referencia = enTiempoReal ? envio?.envioId : lastEnvioId;
                if (referencia !== undefined && checkpoint >= referencia)
                    continue;
            }

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
