import { EnvioProcesado } from "../types/envioProcesado.js";
import { EstadoProblema } from "../types/estadoProblema.js";
import { EstadoUsuario } from "../types/estadoUsuario.js";
import usuarioService from "./usuarioService.js";
import problemaService from "./problemaService.js";
import logrosService from "./logros/logrosService.js";

class EstadosService {

    private estadosUsuarios: Map<string, EstadoUsuario> = new Map();
    private estadosProblemas: Map<string, EstadoProblema> = new Map();

    /**
     * Inicializa los estados internos de usuarios y problemas cargando los datos actuales desde la base de datos.
     * @param envios - Array de envios del bloque a procesar
     * @returns Objeto con estadosUsuarios, estadosProblemas
     */
    public async initEstados(envios: EnvioProcesado[]) {
        
        this.estadosUsuarios = new Map<string, EstadoUsuario>();
        this.estadosProblemas = new Map<string, EstadoProblema>();

        //carga desde la base de datos los datos actuales de los usuarios de este bloque
        for (const usuario of envios.map(envio => envio.usuario)) {
            const estadoUsuario = await this.cargarEstadoUsuario(usuario);
            this.estadosUsuarios.set(usuario, estadoUsuario);
        }

        //carga desde la base de datos los datos actuales de los problemas de este bloque
        for (const problema of envios.map(envio => envio.problema)) {
            const estadoProblema = await this.cargarEstadoProblema(problema);
            this.estadosProblemas.set(problema, estadoProblema);
        }

        return {
            estadosUsuariosInicial: this.clonarEstadosUsuarios(this.estadosUsuarios),
            estadosProblemasInicial: this.clonarEstadosProblemas(this.estadosProblemas)
        };
    }

    /**
     * Generador que procesa los envios en orden, actualizando los estados internos por cada uno.
     * Requiere llamar a initEstados antes para que los mapas esten cargados.
     * @param envios - Array de envios a procesar en orden.
     * @yields Objeto con estadosUsuarios y estadosProblemas actualizados junto al envio que los modifico.
     */
    public async * getEstados(envios: EnvioProcesado[]) {

        for (const envio of envios) {
            //se actualizan los estados que han sido modificados por el envio
            this.actualizarEstadoUsuario(envio.usuario, envio);
            this.actualizarEstadoProblema(envio.problema, envio);

            //se devuelven los mapas actualizados junto con el envio
            yield {
                estadosUsuarios: this.estadosUsuarios,
                estadosProblemas: this.estadosProblemas,
                envio
            };
        }
    }

    /**
     * Rellena el estado del usuario con los datos actuales almacenados en Redis.  
     * @param usuario - Identificador del usuario.   
     * @returns Objeto de estado del usuario.
     */
    private async cargarEstadoUsuario(usuario: string): Promise<EstadoUsuario> {

        const estadoUsuario: EstadoUsuario = this.initEstadoUsuario();

        estadoUsuario.numEnvios = await usuarioService.getNumEnvios(usuario);
        estadoUsuario.problemasAC = new Set(await usuarioService.getProblemasResueltos(usuario));

        const resultados = await usuarioService.getResultados(usuario);
        estadoUsuario.resultados = new Map(resultados.map(r => [r.name, r.value]));

        const lenguajes = await usuarioService.getLenguajes(usuario);
        estadoUsuario.lenguajes = new Set(lenguajes.map(l => l.name));
        estadoUsuario.lenguajesConteo = new Map(lenguajes.map(l => [l.name, l.value]));

        const lenguajesAC = await usuarioService.getLenguajesAC(usuario);
        estadoUsuario.lenguajesAC = new Map(lenguajesAC.map(l => [l.name, l.value]));

        const diasValor = await usuarioService.getDiasValor(usuario);
        estadoUsuario.diasValor = new Map(diasValor.map(d => [d.timestamp, d.value]));

        estadoUsuario.rachaEnviosAC = await usuarioService.getRachaEnviosCorrectos(usuario);
        estadoUsuario.rachaEnviosACMax = estadoUsuario.rachaEnviosAC;
        estadoUsuario.rachaDiasEnvio = await usuarioService.getRachaDiasEnviosConsecutivos(usuario);
        estadoUsuario.rachaDiasEnvioMax = estadoUsuario.rachaDiasEnvio;
        estadoUsuario.ultimoDiaEnvio = await usuarioService.getUltimoEnvioUsuario(usuario);
        estadoUsuario.horas = new Set(await usuarioService.getHoras(usuario));
        estadoUsuario.logros = new Set(await logrosService.getLogros(usuario));

        return estadoUsuario;
    }

    /**
     * Crea un estado de usuario vacio con todos los contadores a cero.
     * @returns Estado inicial del usuario.
     */
    private initEstadoUsuario(): EstadoUsuario {
        return {
            numEnvios: 0,
            problemasAC: new Set(),
            problemasNoAC: new Set(),
            resultados: new Map(),
            lenguajes: new Set(),
            lenguajesConteo: new Map(),
            lenguajesAC: new Map(),
            lenguajesProblemasResueltos: new Map(),
            diasValor: new Map(),
            rachaEnviosAC: 0,
            rachaEnviosACMax: 0,
            rachaDiasEnvio: 0,
            rachaDiasEnvioMax: 0,
            ultimoDiaEnvio: 0,
            horas: new Set(),
            logros: new Set(),
        }
    }
    
    /**
     * Aplica el impacto de un envio sobre el estado del usuario.
     * @param usuario - Identificador del usuario a actualizar.
     * @param envio - Envio que genera el cambio de estado.
     */
    private actualizarEstadoUsuario(usuario: string, envio: EnvioProcesado) {

        const estadoUsuario = this.estadosUsuarios.get(usuario) as EstadoUsuario;

        //se incrementa el total de envios del usuario
        estadoUsuario.numEnvios++;
        //se registra el resultado del envio
        estadoUsuario.resultados.set(envio.resultado, (estadoUsuario.resultados.get(envio.resultado) ?? 0) + 1);
        //se registra la hora del envio
        estadoUsuario.horas.add(envio.hora);
        //se registra el lenguaje usado y su conteo
        estadoUsuario.lenguajes.add(envio.lenguaje);
        estadoUsuario.lenguajesConteo.set(envio.lenguaje, (estadoUsuario.lenguajesConteo.get(envio.lenguaje) ?? 0) + 1);
        //se registra el envio en el dia correspondiente
        estadoUsuario.diasValor.set(envio.fecha, (estadoUsuario.diasValor.get(envio.fecha) ?? 0) + 1);

        //si el ultimo envio fue exactamente el dia anterior, se incrementa la racha de dias consecutivos
        //si fue hace mas de un dia, la racha se reinicia a 0
        if (estadoUsuario.ultimoDiaEnvio < (envio.fecha - 24 * 60 * 60))
            estadoUsuario.rachaDiasEnvio = 0;
        else if (estadoUsuario.ultimoDiaEnvio === envio.fecha - 24 * 60 * 60)
            estadoUsuario.rachaDiasEnvio++;
        if (estadoUsuario.rachaDiasEnvio > estadoUsuario.rachaDiasEnvioMax)
            estadoUsuario.rachaDiasEnvioMax = estadoUsuario.rachaDiasEnvio;

        //se marca el nuevo ultimo dia
        estadoUsuario.ultimoDiaEnvio = envio.fecha;

        if (envio.resultado === "AC") {
            //se registra el problema como resuelto
            estadoUsuario.problemasAC.add(envio.problema);
            //se registra el problema como resuelto con este lenguaje
            if (!estadoUsuario.lenguajesProblemasResueltos.has(envio.lenguaje))
                estadoUsuario.lenguajesProblemasResueltos.set(envio.lenguaje, new Set());
            estadoUsuario.lenguajesProblemasResueltos.get(envio.lenguaje)!.add(envio.problema);
            //se incrementa el conteo de ACs por lenguaje
            estadoUsuario.lenguajesAC.set(envio.lenguaje, (estadoUsuario.lenguajesAC.get(envio.lenguaje) ?? 0) + 1);
            //se incrementa la racha de envios AC
            estadoUsuario.rachaEnviosAC++;
            if (estadoUsuario.rachaEnviosAC > estadoUsuario.rachaEnviosACMax)
                estadoUsuario.rachaEnviosACMax = estadoUsuario.rachaEnviosAC;
        }
        else {
            //se registra el problema como intentado sin exito
            estadoUsuario.problemasNoAC.add(envio.problema);
            //un envio incorrecto rompe la racha de ACs consecutivos
            estadoUsuario.rachaEnviosAC = 0;
        }

        this.estadosUsuarios.set(usuario, estadoUsuario);
    }
    
    /**
     * Devuelve una copia profunda del mapa de estados de usuarios.
     * @param estados - Mapa original de estados de usuarios.
     * @returns Nuevo mapa con todos los objetos mutables clonados.
     */
    private clonarEstadosUsuarios(estados: Map<string, EstadoUsuario>): Map<string, EstadoUsuario> {
        const clon = new Map<string, EstadoUsuario>();
        
        //se usan los campos del estado y se clonan los objetos mutables para evitar referencias compartidas
        for (const [usuario, estado] of estados) {
            clon.set(usuario, {
                ...estado,
                problemasAC: new Set(estado.problemasAC),
                problemasNoAC: new Set(estado.problemasNoAC),
                resultados: new Map(estado.resultados),
                lenguajes: new Set(estado.lenguajes),
                lenguajesConteo: new Map(estado.lenguajesConteo),
                lenguajesAC: new Map(estado.lenguajesAC),
                lenguajesProblemasResueltos: new Map([...estado.lenguajesProblemasResueltos].map(([l, s]) => [l, new Set(s)])),
                diasValor: new Map(estado.diasValor),
                horas: new Set(estado.horas),
                logros: new Set(estado.logros),
            });
        }

        return clon;
    }

    /**
     * Rellena el estado del problema con los datos actuales almacenados en Redis.
     * @param problema - Identificador del problema.
     * @returns Objeto de estado del problema.
     */
    private async cargarEstadoProblema(problema: string): Promise<EstadoProblema> {

        const estadoProblema: EstadoProblema = this.initEstadoProblema();

        estadoProblema.envios = await problemaService.getNumEnvios(problema);
        estadoProblema.enviosAC = await problemaService.getNumEnviosAC(problema);
        estadoProblema.mejorTiempo = await problemaService.getMejorTiempo(problema);
        estadoProblema.tiempoTotal = await problemaService.getTiempoTotal(problema);

        const resultados = await problemaService.getResultados(problema);
        estadoProblema.resultados = new Map(resultados.map(r => [r.name, r.value]));

        const lenguajes = await problemaService.getLenguajes(problema);
        estadoProblema.lenguajes = new Map(lenguajes.map(l => [l.name, l.value]));

        estadoProblema.tiemposOrdenados = await problemaService.getTiemposOrdenados(problema);

        return estadoProblema;
    }

    /**
     * Crea un estado de problema vacio con todos los contadores a cero.
     * @returns Estado inicial del problema.
     */
    private initEstadoProblema(): EstadoProblema {
        return {
            envios: 0,
            enviosAC: 0,
            mejorTiempo: Infinity,
            tiempoTotal: 0,
            resultados: new Map(),
            lenguajes: new Map(),
            tiemposOrdenados: [],
            
            posUltimoEnvio: -1,
            tiemposEnvios: new Map()
        }
    }

    /**
     * Aplica el impacto de un envio sobre el estado del problema.
     * @param problema - Identificador del problema a actualizar.
     * @param envio - Envio que genera el cambio de estado.
     */
    private actualizarEstadoProblema(problema: string, envio: EnvioProcesado) {

        const estadoProblema = this.estadosProblemas.get(problema) as EstadoProblema;

        //se registra el resultado y el lenguaje en el estado del problema
        estadoProblema.envios++;
        estadoProblema.resultados.set(envio.resultado, (estadoProblema.resultados.get(envio.resultado) ?? 0) + 1);
        estadoProblema.lenguajes.set(envio.lenguaje, (estadoProblema.lenguajes.get(envio.lenguaje) ?? 0) + 1);

        if (envio.resultado === "AC") {

            //se incrementa el total de envios AC del problema
            estadoProblema.enviosAC++;

            //se actualiza el mejor tiempo y el tiempo total del problema
            estadoProblema.tiempoTotal += envio.tiempo;

            //si el tiempo de este envio es mejor que el mejor registrado, se actualiza
            if (envio.tiempo <= (estadoProblema.mejorTiempo ?? Infinity))
                estadoProblema.mejorTiempo = envio.tiempo;

            //se inserta el tiempo en el array ordenado para el ranking
            const pos = estadoProblema.tiemposOrdenados.findIndex(t => t > envio.tiempo);
            if (pos === -1) 
                estadoProblema.tiemposOrdenados.push(envio.tiempo);
            else 
                estadoProblema.tiemposOrdenados.splice(pos, 0, envio.tiempo);

            //se registra el tiempo del envio
            estadoProblema.tiemposEnvios.set(envio.envioId, envio.tiempo);

            //se actualiza el indice del ultimo envio
            estadoProblema.posUltimoEnvio = pos;
        }

        this.estadosProblemas.set(problema, estadoProblema);
    }

    /**
     * Devuelve una copia profunda del mapa de estados de problemas.
     * @param estados - Mapa original de estados de problemas.
     * @returns Nuevo mapa con todos los objetos mutables clonados.
     */
    private clonarEstadosProblemas(estados: Map<string, EstadoProblema>): Map<string, EstadoProblema> {
        const clon = new Map<string, EstadoProblema>();
        
        //se usan los campos del estado y se clonan los objetos mutables para evitar referencias compartidas
        for (const [problema, estado] of estados) {
            clon.set(problema, {
                ...estado,
                tiemposOrdenados: [...estado.tiemposOrdenados],
                resultados: new Map(estado.resultados),
                lenguajes: new Map(estado.lenguajes),
            });
        }

        return clon;
    }
}

export default new EstadosService();