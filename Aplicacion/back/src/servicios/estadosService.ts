import { EnvioProcesado } from "../types/envios/envioProcesado.js";
import { EstadoProblema } from "../types/estados/estadoProblema.js";
import { EstadoUsuario } from "../types/estados/estadoUsuario.js";

import { ActualizadorUsuario } from "./actualizadoresEstados/usuarioActualizadorInterface.js";
import { ActualizadorProblema } from "./actualizadoresEstados/problemaActualizadorInterface.js";

import numEnviosUsuario from "./actualizadoresEstados/usuarios/numEnviosActualizador.js";
import problemasUsuario from "./actualizadoresEstados/usuarios/problemasActualizador.js";
import resultadosUsuario from "./actualizadoresEstados/usuarios/resultadosActualizador.js";
import lenguajesUsuario from "./actualizadoresEstados/usuarios/lenguajesActualizador.js";
import diasValorUsuario from "./actualizadoresEstados/usuarios/diasValorActualizador.js";
import rachasUsuario from "./actualizadoresEstados/usuarios/rachasActualizador.js";
import horasUsuario from "./actualizadoresEstados/usuarios/horasActualizador.js";
import logrosDAO from "../dao/logrosDAO.js";

import enviosProblema from "./actualizadoresEstados/problemas/enviosActualizador.js";
import resultadosProblema from "./actualizadoresEstados/problemas/resultadosActualizador.js";
import lenguajesProblema from "./actualizadoresEstados/problemas/lenguajesActualizador.js";
import tiemposProblema from "./actualizadoresEstados/problemas/tiemposActualizador.js";


class EstadosService {

    //actualizadores que componen el estado del usuario
    //para añadir un nuevo dato basta con crear un nuevo actualizador y registrarlo aqui
    private actualizadoresUsuario: ActualizadorUsuario[] = [
        numEnviosUsuario,
        problemasUsuario,
        resultadosUsuario,
        lenguajesUsuario,
        diasValorUsuario,
        rachasUsuario,
        horasUsuario,
    ];

    //actualizadores que componen el estado del problema
    private actualizadoresProblema: ActualizadorProblema[] = [
        enviosProblema,
        resultadosProblema,
        lenguajesProblema,
        tiemposProblema,
    ];

    /**
     * Devuelve los actualizadores de los usuarios.
     */
    public getActualizadoresUsuarios() {
        return this.actualizadoresUsuario
    }

    /**
     * Devuelve los actualizadores de los problemas.
     */
    public getActualizadoresProblemas() {
        return this.actualizadoresProblema;
    }

    /**
     * Inicializa los estados de usuario con los datos almacenados en la base de datos.
     * @param usuarios - Conjunto de identificadores de usuario a inicializar.
     * @returns Mapa de estado inicial por usuario.
     */
    public async getEstadosInicialesUsuarios(usuarios: Set<string>): Promise<Map<string, EstadoUsuario>> {
        const estadosUsuarios: Map<string, EstadoUsuario> = new Map();
        for (const usuario of usuarios) {
            const estado: EstadoUsuario = {};
            for (const actualizador of this.actualizadoresUsuario) {
                actualizador.inicializar(estado);
                await actualizador.cargarInicial(estado, usuario);
            }
            estadosUsuarios.set(usuario, estado);
        }
        return estadosUsuarios;
    }

    /**
     * Inicializa los estados de problema con los datos almacenados en la base de datos.
     * @param problemas - Conjunto de identificadores de problema a inicializar.
     * @returns Mapa de estado inicial por problema.
     */
    public async getEstadosInicialesProblemas(problemas: Set<string>): Promise<Map<string, EstadoProblema>> {
        const estadosProblemas: Map<string, EstadoProblema> = new Map();
        for (const problema of problemas) {
            const estado = {};
            for (const actualizador of this.actualizadoresProblema) {
                actualizador.inicializar(estado);
                await actualizador.cargarInicial(estado, problema);
            }
            estadosProblemas.set(problema, estado);
        }
        return estadosProblemas;
    }

    /**
     * Generador que actualiza los estados con cada envio y los devuelve en orden.
     * Si se indica `checkpointsStat`, cada actualizador solo procesa los envios cuyo
     * envioId sea estrictamente mayor que su checkpoint (ya procesados se omiten).
     */
    public async * getEstadosActualizados(
        envios: EnvioProcesado[], 
        checkpointsUsuarios: Map<string, number>, 
        checkpointsProblemas: Map<string, number>,
        estadosUsuarios: Map<string, EstadoUsuario>,
        estadosProblemas: Map<string, EstadoProblema>
    ) {

        for (const envio of envios) {

            let estadoUsuario = estadosUsuarios.get(envio.usuario)!;
            if (estadoUsuario === undefined)
                estadoUsuario = {};

            let estadoProblema = estadosProblemas.get(envio.problema)!;
            if (estadoProblema=== undefined)
                estadoProblema = {};

            //USUARIOS
            for (const actualizador of this.actualizadoresUsuario) {

                //se mira si el estado tiene la informacion, si la tiene se actualiza
                if (estadoUsuario[actualizador.id as keyof EstadoUsuario] !== undefined)
                    actualizador.actualizar(estadoUsuario, envio);

                //si se llega al envio en el que se pasa el checkpoint del actualizador se incluye la informacion en el estado
                //esto se haria haciendo primero una llamada al cargar de la base de datos del actualizador
                else if ((checkpointsUsuarios?.get(actualizador.id) ?? 0) < envio.envioId) {
                    actualizador.inicializar(estadoUsuario);
                    await actualizador.cargarInicial(estadoUsuario, envio.usuario);
                    actualizador.actualizar(estadoUsuario, envio);
                }
                    
            }
            if (estadoUsuario.logros === undefined)
                estadoUsuario.logros = new Set(await logrosDAO.getLogros(envio.usuario));

            estadosUsuarios.set(envio.usuario, estadoUsuario);

            //PROBLEMAS
            for (const actualizador of this.actualizadoresProblema) {

                //se mira si el estado tiene la informacion, si la tiene se actualiza
                if (estadoProblema[actualizador.id as keyof EstadoProblema] !== undefined)
                    actualizador.actualizar(estadoProblema, envio);

                //si se llega al envio en el que se pasa el checkpoint del actualizador se incluye la informacion en el estado
                else if ((checkpointsProblemas?.get(actualizador.id) ?? 0) < envio.envioId) {
                    actualizador.inicializar(estadoProblema);
                    await actualizador.cargarInicial(estadoProblema, envio.problema);
                    actualizador.actualizar(estadoProblema, envio);
                }
                    
            }
            estadosProblemas.set(envio.problema, estadoProblema);

            yield {
                estadosUsuarios: estadosUsuarios,
                estadosProblemas: estadosProblemas,
                envio
            };
        }
    }
}

export default new EstadosService();