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
import logrosUsuario from "./actualizadoresEstados/usuarios/logrosActualizador.js";

import enviosProblema from "./actualizadoresEstados/problemas/enviosActualizador.js";
import resultadosProblema from "./actualizadoresEstados/problemas/resultadosActualizador.js";
import lenguajesProblema from "./actualizadoresEstados/problemas/lenguajesActualizador.js";
import tiemposProblema from "./actualizadoresEstados/problemas/tiemposActualizador.js";


class EstadosService {

    //calculadores que componen el estado del usuario
    //para añadir un nuevo dato basta con crear un nuevo calculador y registrarlo aqui
    private actualizadoresUsuario: ActualizadorUsuario[] = [
        numEnviosUsuario,
        problemasUsuario,
        resultadosUsuario,
        lenguajesUsuario,
        diasValorUsuario,
        rachasUsuario,
        horasUsuario,
        logrosUsuario,
    ];

    //calculadores que componen el estado del problema
    private actualizadoresProblema: ActualizadorProblema[] = [
        enviosProblema,
        resultadosProblema,
        lenguajesProblema,
        tiemposProblema,
    ];

    /**
     * Devuelve los calculadores registrados para que otros servicios puedan consultarlos.
     */
    public getActualizadores() {
        return {
            calculadoresUsuario: this.actualizadoresUsuario,
            calculadoresProblema: this.actualizadoresProblema,
        };
    }

    /**
     * Inicializa los estados de usuarios y problemas con los datos almacenados en la base de datos.
     * @returns Copia profunda de los estados iniciales para usarlos como referencia.
     */
    public async getEstadosIniciales(usuarios: Set<string>, problemas: Set<string>) {

        const estadosUsuarios: Map<string, EstadoUsuario> = new Map();
        const estadosProblemas: Map<string, EstadoProblema> = new Map();

        //crea los estados vacios para los usuarios y los rellena desde la base de datos
        for (const usuario of usuarios) {
            const estado = {};
            for (const calculador of this.actualizadoresUsuario) {
                calculador.inicializar(estado);
                await calculador.cargarInicial(estado, usuario);
            }
            estadosUsuarios.set(usuario, estado);
        }

        //crea los estados vacios para los problemas y los rellena desde la base de datos
        for (const problema of problemas) {
            const estado = {};
            for (const calculador of this.actualizadoresProblema) {
                calculador.inicializar(estado);
                await calculador.cargarInicial(estado, problema);
            }
            estadosProblemas.set(problema, estado);
        }

        //se devuelven copiados porque si no se comparten las referencias a los campos mutables de los estados con el servicio de logros
        return {
            estadosUsuariosIniciales: estadosUsuarios,
            estadosProblemasIniciales: estadosProblemas
        };
    }

    /**
     * Generador que actualiza los estados con cada envio y los devuelve en orden.
     * Si se indica `checkpointsStat`, cada calculador solo procesa los envios cuyo
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
            for (const calculador of this.actualizadoresUsuario) {

                //se mira si el estado tiene la informacion, si la tiene se actualiza
                if (estadoUsuario[calculador.id as keyof EstadoUsuario] !== undefined)
                    calculador.actualizar(estadoUsuario, envio);

                //si se llega al envio en el que se pasa el checkpoint del calculador se incluye la informacion en el estado
                //esto se haria haciendo primero una llamada al cargar de la base de datos del calculador
                else if ((checkpointsUsuarios?.get(calculador.id) ?? 0) < envio.envioId) {
                    calculador.inicializar(estadoUsuario);
                    await calculador.cargarInicial(estadoUsuario, envio.usuario);
                    calculador.actualizar(estadoUsuario, envio);
                }
                    
            }
            estadosUsuarios.set(envio.usuario, estadoUsuario);
                
            //PROBLEMAS
            for (const calculador of this.actualizadoresProblema) {

                //se mira si el estado tiene la informacion, si la tiene se actualiza
                if (estadoProblema[calculador.id as keyof EstadoProblema] !== undefined)
                    calculador.actualizar(estadoProblema, envio);

                //si se llega al envio en el que se pasa el checkpoint del calculador se incluye la informacion en el estado
                else if ((checkpointsProblemas?.get(calculador.id) ?? 0) < envio.envioId) {
                    calculador.inicializar(estadoProblema);
                    await calculador.cargarInicial(estadoProblema, envio.problema);
                    calculador.actualizar(estadoProblema, envio);
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