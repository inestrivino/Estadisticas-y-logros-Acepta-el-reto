import { logros } from "./definiciones/logro.js";
import { EstadoUsuario } from "../../types/estadoUsuario.js";
import { EstadoProblema } from "../../types/estadoProblema.js";
import usuarioDAO from "../../dao/usuarioDAO.js";
import logrosDAO from "../../dao/logrosDAO.js";
import { datosLogro } from "../../types/datosLogro.js";
import problemaDAO from "../../dao/problemaDAO.js";
import { EnvioProcesado } from "../../types/envioProcesado.js";
import { Logro } from "../../types/logro.js";

class LogrosService {

    private estadosUsuarios = new Map<string, EstadoUsuario>();
    private estadosProblemas = new Map<string, EstadoProblema>();

    /**
     * Devuelve todos los logros indicando si el usuario los tiene o no, agrupados segun la clasificacion.
     * @param usuario - Identificador del usuario.
     * @param clasificacion - Criterio de agrupacion: `"nivel"` o `"categoria"`.
     * @returns Objeto con la clasificacion y los grupos de logros.
     */
    public async getLogrosUsuario(usuario: string, clasificacion: string) {
        const setLogros = new Set(await logrosDAO.getLogros(usuario));

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

    public getLogroByName(logro: string): Logro | undefined {
        return logros.find(l => l.nombre === logro);
    }

    /**
     * Calcula los logros nuevos obtenidos por cada usuario a partir de un bloque de envios.
     * Carga el estado previo desde Redis, simula el impacto de cada envio y evalua las condiciones.
     * @param envios - Array de envios procesados del bloque.
     * @returns Array con los logros nuevos agrupados por usuario.
     */
    public async procesarBloqueEnvios(envios: EnvioProcesado[]): Promise<datosLogro[]> {
        //carga desde Redis los datos actuales de los usuarios de este bloque
        for (const usuario of envios.map(envio => envio.usuario)) {
            const estadoUsuario: EstadoUsuario = this.initEstado();
            await this.cargarEstadoUsuario(usuario, estadoUsuario);
            this.estadosUsuarios.set(usuario, estadoUsuario);
        }
        //carga desde Redis los datos actuales de los problemas de este bloque
        for (const problema of envios.map(envio => envio.problema)) {
            const estadoProblema: EstadoProblema = {envios: 0, mejorTiempo: Infinity};

            //carga en el estado el mejor tiempo del problema
            estadoProblema.mejorTiempo = await problemaDAO.getMejorTiempo(problema);

            //carga en el estado el numero de envios
            const numEnvios = await problemaDAO.getNumEnvios(problema);
            estadoProblema.envios = numEnvios !== 0 ? numEnvios : Infinity;

            //pone en el mapa el estado de este problema
            this.estadosProblemas.set(problema, estadoProblema);
        }

        //acumula los logros nuevos por usuario a lo largo de todo el bloque
        const nuevosPorUsuario = new Map<string, string[]>();

        //se itera por cada envio modificando los estados y comprobando los trofeos conseguidos con ese envio
        for (const envio of envios) {
            const estadoUsuario = this.estadosUsuarios.get(envio.usuario) as EstadoUsuario;
            const estadoProblema = this.estadosProblemas.get(envio.problema) as EstadoProblema;
            this.actualizarEstado(estadoUsuario, estadoProblema, envio);
            const nuevos = this.comprobarLogros(true, estadoUsuario, estadoProblema, envio);
            if (nuevos.length > 0) {
                const acumulados = nuevosPorUsuario.get(envio.usuario) ?? [];
                nuevosPorUsuario.set(envio.usuario, acumulados.concat(nuevos));
            }
        }

        //tras procesar todos los envios del bloque se comprueban los trofeos que requieren el estado completo del usuario
        const usuarios = new Set(envios.map(envio => envio.usuario));
        for (const usuario of usuarios) {
            const estadoUsuario = this.estadosUsuarios.get(usuario) as EstadoUsuario;
            const nuevos = this.comprobarLogros(false, estadoUsuario);
            if (nuevos.length > 0) {
                const acumulados = nuevosPorUsuario.get(usuario) ?? [];
                nuevosPorUsuario.set(usuario, acumulados.concat(nuevos));
            }
        }

        const trofeos = Array.from(nuevosPorUsuario.entries()).map(([usuario, logros]) => ({ usuario, logros }));
        await logrosDAO.guardarBloqueLogros(trofeos);
        return trofeos;
    }

    /**
     * Crea un estado de usuario vacio con todos los contadores a cero.
     * @returns Estado inicial del usuario.
     */
    private initEstado(): EstadoUsuario {
        return {
            numEnvios: 0,
            problemasAC: new Set(),
            problemasNoAC: new Set(),
            lenguajesProblemasResueltos: new Map<string, Set<string>>(),
            lenguajes: new Set(),
            logros: new Set(),
            rachaEnviosAC: 0,
            rachaDiasEnvio: 0,
            ultimoDiaEnvio: 0,
            horas: new Set(),
        }
    }

    /**
     * Rellena el estado del usuario con los datos actuales almacenados en Redis.
     * @param usuario - Identificador del usuario.
     * @param estadoUsuario - Objeto de estado a rellenar.
     */
    private async cargarEstadoUsuario(usuario: string, estadoUsuario: EstadoUsuario) {
        //numero de envios
        estadoUsuario.numEnvios = (await usuarioDAO.getNumEnvios(usuario));

        //problemas resueltos
        estadoUsuario.problemasAC = new Set(await usuarioDAO.getProblemasResueltos(usuario));

        //lenguajes usados
        estadoUsuario.lenguajes = new Set((await usuarioDAO.getLenguajes(usuario)).map(aux => aux.name));

        //racha de envios acertados
        estadoUsuario.rachaEnviosAC = await usuarioDAO.getRachaEnviosCorrectos(usuario);

        //racha de dias consecutivos haciendo envios
        estadoUsuario.rachaDiasEnvio = await usuarioDAO.getRachaDiasEnviosConsecutivos(usuario);

        //ultimo dia en el que hizo un envio
        estadoUsuario.ultimoDiaEnvio = await usuarioDAO.getUltimoEnvioUsuario(usuario);

        //horas del dia en las que ha hecho un envio
        estadoUsuario.horas = new Set(await usuarioDAO.getHoras(usuario));

        //logros ya conseguidos por el usuario, para poder saltarlos en comprobarLogros
        estadoUsuario.logros = new Set(await logrosDAO.getLogros(usuario));

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

    /**
     * Aplica el impacto de un envio sobre los estados del usuario y del problema.
     * @param estadoUsuario - Estado del usuario a actualizar.
     * @param estadoProblema - Estado del problema a actualizar.
     * @param envio - Envio que genera el cambio de estado.
     */
    private actualizarEstado(estadoUsuario: EstadoUsuario, estadoProblema: EstadoProblema, envio: EnvioProcesado) {

        //se incrementa el total de envios del usuario
        estadoUsuario.numEnvios++;
        //se registra la hora del envio
        estadoUsuario.horas.add(envio.hora);
        //se registra el lenguaje usado
        estadoUsuario.lenguajes.add(envio.lenguaje);

        //si el ultimo envio fue exactamente el dia anterior, se incrementa la racha de dias consecutivos
        //si fue hace mas de un dia, la racha se reinicia a 0
        if (estadoUsuario.ultimoDiaEnvio < (envio.fecha - 24*60*60))
            estadoUsuario.rachaDiasEnvio = 0;
        else if (estadoUsuario.ultimoDiaEnvio === envio.fecha - 24*60*60)
            estadoUsuario.rachaDiasEnvio++;

        //se marca el nuevo ultimo dia
        estadoUsuario.ultimoDiaEnvio = envio.fecha;

        if (envio.resultado === "AC") {
            //se registra el problema como resuelto
            estadoUsuario.problemasAC.add(envio.problema);
            //se registra el problema como resuelto con este lenguaje
            if (!estadoUsuario.lenguajesProblemasResueltos.has(envio.lenguaje))
                estadoUsuario.lenguajesProblemasResueltos.set(envio.lenguaje, new Set());
            estadoUsuario.lenguajesProblemasResueltos.get(envio.lenguaje)!.add(envio.problema);

            //si el tiempo de ejecucion iguala o mejora el record del problema, se actualiza
            if (envio.tiempo <= (estadoProblema.mejorTiempo ?? Infinity))
                estadoProblema.mejorTiempo = envio.tiempo;
        } 
        else {
            //se registra el problema como intentado sin exito
            estadoUsuario.problemasNoAC.add(envio.problema);
            //un envio incorrecto rompe la racha de ACs consecutivos
            estadoUsuario.rachaEnviosAC = 0;
        }
    }
}

export default new LogrosService();
