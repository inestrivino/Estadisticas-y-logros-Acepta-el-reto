import { EstadoUsuario } from "../types/estados/estadoUsuario.js";
import { EstadoProblema } from "../types/estados/estadoProblema.js";
import logrosDAO from "../dao/logrosDAO.js";
import { datosLogro } from "../types/datos/datosLogro.js";
import { EnvioProcesado } from "../types/envios/envioProcesado.js";
import { Logro } from "./logros/logro.js";
import { NivelLogro } from "../types/enums/nivelLogro.js";
import { Pipeline } from "../dao/DAO.js";

//puntos de XP que aporta cada logro segun su nivel
const XP_LOGRO: Record<NivelLogro, number> = {
    [NivelLogro.BRONCE]: 20,
    [NivelLogro.PLATA]: 40,
    [NivelLogro.ORO]: 60,
};

import logro1 from "./logros/onboarding/logro1.js";
import logro2 from "./logros/onboarding/logro2.js";
import logro3 from "./logros/onboarding/logro3.js";

import { TrofeoProblema } from "./logros/problemas/trofeoProblema.js";

import { TrofeoLenguaje } from "./logros/lenguajes/trofeoLenguaje.js";
import logro11 from "./logros/lenguajes/logro11.js";

import { TrofeoRachaEnviosAC } from "./logros/rachas/trofeoRachaEnviosAC.js";
import { TrofeoRachaDias } from "./logros/rachas/trofeoRachaDias.js";
import logro18 from "./logros/rachas/logro18.js";

import logro14 from "./logros/calidad/logro14.js";
import logro15 from "./logros/calidad/logro15.js";
import logro17 from "./logros/calidad/logro17.js";

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

    //para añadir nuevos logros basta con añadirlos a esta lista
    private logros: Logro[] = [
        //onboarding
        logro1,
        logro2,
        logro3,

        //problemas
        new TrofeoProblema(4, "logro4", 10, NivelLogro.BRONCE, "trofeo_bronce_placeholder.png"),
        new TrofeoProblema(5, "logro5", 50, NivelLogro.PLATA, "trofeo_plata_placeholder.png"),
        new TrofeoProblema(6, "logro6", 100, NivelLogro.PLATA, "trofeo_plata_placeholder.png"),
        new TrofeoProblema(7, "logro7", 500, NivelLogro.ORO, "trofeo_oro_placeholder.png"),

        //lenguajes
        new TrofeoLenguaje(8, "logro8", "c", "C", "trofeo_oro_placeholder.png"),
        new TrofeoLenguaje(9, "logro9", "cpp", "C++", "trofeo_oro_placeholder.png"),
        new TrofeoLenguaje(10, "logro10", "java", "Java", "trofeo_oro_placeholder.png"),
        logro11,

        //rachas
        new TrofeoRachaEnviosAC(12, "logro12", 5, NivelLogro.ORO, "trofeo_oro_placeholder.png"),
        new TrofeoRachaDias(13, "logro13", 7, NivelLogro.BRONCE, "trofeo_bronce_placeholder.png"),
        logro18,

        //calidad
        logro14,
        logro15,
        logro17,
    ];

    /**
     * Devuelve la lista plana de todas las definiciones de logros registradas.
     */
    public getDefiniciones(): Logro[] {
        return this.logros;
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
     * Persiste los 3 logros mas recientes de cada usuario en orden cronologico de obtencion.
     * @param nuevosLogros - Mapa de usuario a array de logros nuevos en orden de obtencion.
     */
    public async guardarUltimosLogros(nuevosLogros: Map<string, Logro[]>): Promise<void> {
        const datos: datosLogro[] = [];
        for (const [usuario, logros] of nuevosLogros)
            datos.push({ usuario, logros: logros.map(l => l.nombre) });
        await logrosDAO.guardarUltimosLogros(datos);
    }

    /**
     * Calcula la XP aportada por los logros nuevos obtenidos en un periodo.
     * @param nuevosLogros - Conjunto de logros nuevos obtenidos en el periodo.
     * @returns XP total aportada por los logros segun su nivel.
     */
    public calcularXP(nuevosLogros: Set<Logro>): number {
        let total = 0;
        for (const logro of nuevosLogros)
            total += XP_LOGRO[logro.nivel] ?? 0;
        return total;
    }

    /**
     * Encola en el pipeline la persistencia por mes de los logros nuevos
     * obtenidos por el usuario en ese mes.
     * @param pipeline - Pipeline de Redis sobre el que encolar la operacion.
     * @param usuario - Identificador del usuario.
     * @param mes - Mes (0-11) al que pertenecen los logros.
     * @param nuevosLogrosMes - Logros nuevos obtenidos por el usuario en ese mes.
     */
    public registrarMes(pipeline: Pipeline, usuario: string, mes: number, nuevosLogrosMes: Set<Logro>): void {
        if (nuevosLogrosMes.size === 0) return;
        const nombres = [...nuevosLogrosMes].map(l => l.nombre);
        logrosDAO.registrarLogrosUsuarioMes(pipeline, usuario, mes, nombres);
    }

    /**
     * Borra de la base de datos los registros de los logros indicados para que se reevaluen al reprocesar.
     * @param nombres - Conjunto de nombres de logros cuyos registros hay que borrar.
     */
    public async borrarLogros(nombres: Set<string>): Promise<void> {
        for (const nombre of nombres)
            await logrosDAO.borrarLogro(nombre);
    }

    /**
     * Calcula la XP aportada por los logros obtenidos en el mes indicado a partir
     * de los datos mensuales persistidos en la base de datos.
     * @param mes - Mes (0-11) a consultar.
     * @returns Mapa de usuario a XP aportada por sus logros en ese mes.
     */
    public async calcularXPMes(mes: number): Promise<Map<string, number>> {
        const porUsuario = await logrosDAO.getLogrosMes(mes);
        const definicionesPorNombre = new Map(this.logros.map(l => [l.nombre, l]));
        const xp = new Map<string, number>();
        for (const [usuario, nombres] of porUsuario) {
            let total = 0;
            for (const nombre of nombres) {
                const logro = definicionesPorNombre.get(nombre);
                if (logro) total += XP_LOGRO[logro.nivel] ?? 0;
            }
            if (total > 0) xp.set(usuario, total);
        }
        return xp;
    }

    //============================== CONSULTAS ==============================

    /**
     * Devuelve los datos completos de los 3 logros mas recientes del usuario en orden de obtencion.
     * @param usuario - Identificador del usuario.
     * @returns Array con los datos de los logros recientes.
     */
    public async getUltimosLogros(usuario: string) {
        const nombres = await logrosDAO.getUltimosLogros(usuario);
        return nombres
            .map(nombre => this.logros.find(l => l.nombre === nombre))
            .filter(Boolean)
            .map(logro => ({
                nombre: logro!.nombre,
                descripcion: logro!.descripcion,
                imagen: logro!.imagen,
                nivel: logro!.nivel,
                categoria: logro!.categoria,
                sorpresa: logro!.sorpresa,
                obtenido: true,
            }));
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
        const logrosUsuario = this.logros.map(logro => {
            const obtenido = setLogros.has(logro.nombre);
            const ocultar = logro.sorpresa && !obtenido;
            return {
                nombre: logro.nombre,
                //si es sorpresa y aun no se ha obtenido se manda solo la descripcion borrosa para que la real no sea visible desde devtools
                descripcion: ocultar ? "" : logro.descripcion,
                descripcionBorrosa: ocultar ? logro.descripcionBorrosa : undefined,
                imagen: logro.imagen,
                nivel: logro.nivel,
                categoria: logro.categoria,
                sorpresa: logro.sorpresa,
                obtenido,
            };
        });

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
}

export default new LogrosService();
