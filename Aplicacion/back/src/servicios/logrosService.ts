import { EstadoUsuario } from "../types/estados/estadoUsuario.js";
import { EstadoProblema } from "../types/estados/estadoProblema.js";
import logrosDAO from "../dao/logrosDAO.js";
import { datosLogro } from "../types/datos/datosLogro.js";
import { EnvioProcesado } from "../types/envios/envioProcesado.js";
import { Logro } from "./logros/logro.js";
import usuarioService from "./usuarioService.js";
import estadosService from "./estadosService.js";

import { logrosOnboarding } from "./logros/onboarding/index.js";
import { logrosProblemas } from "./logros/problemas/index.js";
import { logrosLenguajes } from "./logros/lenguajes/index.js";
import { logrosRachas } from "./logros/rachas/index.js";
import { logrosCalidad } from "./logros/calidad/index.js";

type Contexto = {
    checkpointsLogro: Map<string, number>
    logrosActuales: Map<string, Set<Logro>>
    estadosUsuarios: Map<string, EstadoUsuario>
    estadosProblemas: Map<string, EstadoProblema>
    envio: EnvioProcesado
}

type InfoParaCondicion = {
    checkpointsLogro: Map<string, number>
    logrosActuales: Set<Logro>
    estadoUsuario: EstadoUsuario
    estadoProblema: EstadoProblema
    envio: EnvioProcesado
}

class LogrosService {

    //para añadir nuevos logros basta con crear un nuevo grupo y añadirlo aqui
    private logros: Logro[] = [
        ...logrosOnboarding,
        ...logrosProblemas,
        ...logrosLenguajes,
        ...logrosRachas,
        ...logrosCalidad,
    ];

    /**
     * Devuelve la lista plana de todas las definiciones de logros registradas.
     */
    public getDefiniciones(): Logro[] {
        return this.logros;
    }

    /**
     * Reevalua un conjunto de logros de estado global contra el estado actual de cada usuario.
     * Borra los registros existentes de esos logros, recalcula las condiciones y persiste los resultados.
     * Solo aplicable a logros que no son en tiempo real y cuyas estadisticas requeridas estan al dia.
     * @param logros - Logros a reevaluar.
     */
    public async reevaluarLogros(logros: Logro[]): Promise<void> {

        //se borran los registros actuales de los logros a reevaluar
        for (const logro of logros)
            await logrosDAO.borrarLogro(logro.nombre);

        //se cargan los estados actuales de todos los usuarios
        const usuarios = new Set(await usuarioService.getTodosUsuarios());
        const estadosUsuarios = await estadosService.getEstadosInicialesUsuarios(usuarios);

        //se reevaluan los logros para cada usuario y se acumulan los obtenidos
        const datos: datosLogro[] = [];
        for (const [usuario, estadoUsuario] of estadosUsuarios) {
            const nuevos = logros
                .filter(l => l.condicion(estadoUsuario, undefined, undefined))
                .map(l => l.nombre);
            if (nuevos.length > 0)
                datos.push({ usuario, logros: nuevos });
        }

        //se guardan los logros recalculados en la base de datos
        await logrosDAO.guardarBloqueLogros(datos);
    }

    /**
     * Evalua los logros en tiempo real para el envio del contexto y acumula los recien obtenidos en `nuevosPorUsuario`.
     * Solo se evaluan los logros cuyo checkpoint es estrictamente menor que el `envioId` del envio.
     * @param contexto - Checkpoints, logros actuales y estados de usuario del bloque.
     * @param extra - Estado de problemas y envio que desencadena la evaluacion.
     */
    public comprobarLogros(contexto: Contexto): Map<string, Set<Logro>> {

        const nuevosPorUsuario = new Map<string, Set<Logro>>();

        const info: InfoParaCondicion = {
            checkpointsLogro: contexto.checkpointsLogro,
            logrosActuales: contexto.logrosActuales.get(contexto.envio.usuario)!,
            estadoUsuario: contexto.estadosUsuarios.get(contexto.envio.usuario)!,
            estadoProblema: contexto.estadosProblemas.get(contexto.envio.problema)!,
            envio: contexto.envio
        }

        const nuevos: Logro[] = [];
        for (const logro of this.logros) {

            //se omiten los logros que el usuario ya tiene
            if (info.logrosActuales.has(logro))
                continue;

            //se omiten los logros cuyo checkpoint ya cubre el envio o estado actual
            const checkpoint = info.checkpointsLogro.get(logro.nombre) as number;
            if (checkpoint >= contexto.envio.envioId)
                continue;

            if (logro.condicion(info.estadoUsuario, info.estadoProblema, info.envio, info.logrosActuales)) {
                info.logrosActuales.add(logro);
                nuevos.push(logro);
            }
        }

        //se acumulan los nuevos logros para este usuario
        if (!nuevosPorUsuario.has(contexto.envio.usuario))
            nuevosPorUsuario.set(contexto.envio.usuario, new Set());
        for (const trofeo of nuevos)
            nuevosPorUsuario.get(contexto.envio.usuario)?.add(trofeo);

        return nuevosPorUsuario;
    }

    /**
     * Persiste globalmente todos los logros nuevos del bloque en Redis.
     * @param nuevosLogros - Mapa de usuario a set de logros nuevos obtenidos en el bloque.
     */
    public async guardarLogros(nuevosLogros: Map<string, Set<Logro>>): Promise<void> {
        const datos: datosLogro[] = [];
        for (const [usuario, logros] of nuevosLogros)
            datos.push({ usuario, logros: Array.from(logros).map(l => l.nombre) });
        await logrosDAO.guardarBloqueLogros(datos);
    }

    /**
     * Persiste los logros nuevos agrupados por mes en Redis (solo ultimos 12 meses).
     * @param nuevosTrofeosPorMes - Mapa de mes a usuario a set de logros nuevos.
     */
    public async guardarLogrosPorMes(nuevosTrofeosPorMes: Map<number, Map<string, Set<Logro>>>): Promise<void> {
        for (const [mes, nuevosPorUsuario] of nuevosTrofeosPorMes) {
            const datos: datosLogro[] = [];
            for (const [usuario, logros] of nuevosPorUsuario)
                datos.push({ usuario, logros: Array.from(logros).map(l => l.nombre) });
            await logrosDAO.guardarBloqueLogrosMes(datos, mes);
        }
    }

    //============================== CONSULTAS ==============================

    /**
     * Devuelve todos los logros indicando si el usuario los tiene o no, agrupados segun la clasificacion.
     * @param usuario - Identificador del usuario.
     * @param clasificacion - Criterio de agrupacion: `"nivel"` o `"categoria"`.
     * @returns Objeto con la clasificacion y los grupos de logros.
     */
    public async getLogrosUsuario(usuario: string, clasificacion: string) {
        const setLogros = new Set(await logrosDAO.getLogros(usuario));

        //agrega el atributo de si el usuario tiene ese logro o no
        const logrosUsuario = this.logros.map(logro => ({
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
     * Devuelve los logros obtenidos por cada usuario indicado.
     * @param usuarios - Array de identificadores de usuario.
     * @returns Mapa de usuario a set de logros obtenidos.
     */
    public async getLogros(usuarios: string[]): Promise<Map<string, Set<Logro>>> {

        const logrosPorUsuario: Map<string, Set<Logro>> = new Map();

        for (const usuario of usuarios) {
            const nombres = await logrosDAO.getLogros(usuario);
            const logros = new Set(nombres.map(n => this.logros.find(l => l.nombre === n)!).filter(Boolean));
            logrosPorUsuario.set(usuario, logros);
        }

        return logrosPorUsuario;
    }

    /**
     * Busca un logro por su nombre.
     * @param logro - Nombre del logro a buscar.
     * @returns El logro encontrado, o `undefined` si no existe.
     */
    //TODO ver si esto tras la refactorizacion es necesario
    /*
    public getLogroByName(logro: string): Logro | undefined {
        return this.trofeos.find(l => l.nombre === logro);
    }
    */
}

export default new LogrosService();
