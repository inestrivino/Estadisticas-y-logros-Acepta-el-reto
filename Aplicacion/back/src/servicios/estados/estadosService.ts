import { EnvioProcesado } from "../../types/envios/envioProcesado.js";
import { EstadoProblema } from "../../types/estados/estadoProblema.js";
import { EstadoUsuario } from "../../types/estados/estadoUsuario.js";

import { CalculadorUsuario } from "./calculadores/calculadorUsuarioInterface.js";
import { CalculadorProblema } from "./calculadores/calculadorProblemaInterface.js";

import numEnviosUsuario from "./calculadores/usuarios/numEnvios.js";
import problemasUsuario from "./calculadores/usuarios/problemas.js";
import resultadosUsuario from "./calculadores/usuarios/resultados.js";
import lenguajesUsuario from "./calculadores/usuarios/lenguajes.js";
import diasValorUsuario from "./calculadores/usuarios/diasValor.js";
import rachasUsuario from "./calculadores/usuarios/rachas.js";
import horasUsuario from "./calculadores/usuarios/horas.js";
import logrosUsuario from "./calculadores/usuarios/logros.js";

import enviosProblema from "./calculadores/problemas/envios.js";
import resultadosProblema from "./calculadores/problemas/resultados.js";
import lenguajesProblema from "./calculadores/problemas/lenguajes.js";
import tiemposProblema from "./calculadores/problemas/tiempos.js";


class EstadosService {

    private estadosUsuarios: Map<string, EstadoUsuario> = new Map();
    private estadosProblemas: Map<string, EstadoProblema> = new Map();

    //calculadores que componen el estado del usuario
    //para añadir un nuevo dato basta con crear un nuevo calculador y registrarlo aqui
    private calculadoresUsuario: CalculadorUsuario[] = [
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
    private calculadoresProblema: CalculadorProblema[] = [
        enviosProblema,
        resultadosProblema,
        lenguajesProblema,
        tiemposProblema,
    ];

    /**
     * Inicializa los estados de usuarios y problemas con los datos almacenados en la base de datos.
     * @returns Copia profunda de los estados iniciales para usarlos como referencia.
     */
    public async getEstadosIniciales(usuarios: Set<string>, problemas: Set<string>) {

        //crea los estados vacios para los usuarios y los rellena desde la base de datos
        for (const usuario of usuarios) {
            const estado = this.estadoVacioUsuario();
            for (const calculador of this.calculadoresUsuario)
                await calculador.cargarInicial(estado, usuario);
            this.estadosUsuarios.set(usuario, estado);
        }

        //crea los estados vacios para los problemas y los rellena desde la base de datos
        for (const problema of problemas) {
            const estado = this.estadoVacioProblema();
            for (const calculador of this.calculadoresProblema)
                await calculador.cargarInicial(estado, problema);
            this.estadosProblemas.set(problema, estado);
        }

        //se devuelven copiados porque si no se comparten las referencias a los campos mutables de los estados con el servicio de logros
        return {
            estadosUsuariosIniciales: this.clonarEstadosUsuarios(this.estadosUsuarios),
            estadosProblemasIniciales: this.clonarEstadosProblemas(this.estadosProblemas)
        };
    }

    /**
     * Generador que actualiza los estados con cada envio y los devuelve en orden.
     */
    public async * getEstadosActualizados(envios: EnvioProcesado[]) {
        
        for (const envio of envios) {

            const estadoUsuario = this.estadosUsuarios.get(envio.usuario)!;
            const estadoProblema = this.estadosProblemas.get(envio.problema)!;

            //se delega en cada calculador la actualizacion de su fragmento del estado
            for (const calculador of this.calculadoresUsuario)
                calculador.actualizar(estadoUsuario, envio);

            for (const calculador of this.calculadoresProblema)
                calculador.actualizar(estadoProblema, envio);

            yield {
                estadosUsuarios: this.estadosUsuarios,
                estadosProblemas: this.estadosProblemas,
                envio
            };
        }
    }

    /**
     * Compone un estado de usuario vacio combinando los fragmentos iniciales de cada calculador.
     */
    private estadoVacioUsuario(): EstadoUsuario {
        return Object.assign({}, ...this.calculadoresUsuario.map(c => c.estadoVacio())) as EstadoUsuario;
    }

    /**
     * Compone un estado de problema vacio combinando los fragmentos iniciales de cada calculador.
     */
    private estadoVacioProblema(): EstadoProblema {
        return Object.assign({}, ...this.calculadoresProblema.map(c => c.estadoVacio())) as EstadoProblema;
    }

    /**
     * Devuelve una copia profunda del mapa de estados de usuarios delegando el clonado de los
     * campos mutables en cada calculador que los declare.
     */
    private clonarEstadosUsuarios(estados: Map<string, EstadoUsuario>): Map<string, EstadoUsuario> {

        const estadoClonado = new Map<string, EstadoUsuario>();

        for (const [usuario, estado] of estados) {

            //se clonan los campos primitivos
            const clonado: EstadoUsuario = { ...estado };

            //y para los campos mutables se delega el clonado a cada calculador que lo declare para evitar referencias compartidas
            for (const calculador of this.calculadoresUsuario)
                if (calculador.clonar)
                    Object.assign(clonado, calculador.clonar(estado));

            estadoClonado.set(usuario, clonado);
        }

        return estadoClonado;
    }

    /**
     * Devuelve una copia profunda del mapa de estados de problemas delegando el clonado de los
     * campos mutables en cada calculador que los declare.
     */
    private clonarEstadosProblemas(estados: Map<string, EstadoProblema>): Map<string, EstadoProblema> {

        const estadoClonado = new Map<string, EstadoProblema>();

        for (const [problema, estado] of estados) {

            //se clonan los campos primitivos
            const clonado: EstadoProblema = { ...estado };

            //y para los campos mutables se delega el clonado a cada calculador que lo declare para evitar referencias compartidas
            for (const calculador of this.calculadoresProblema)
                if (calculador.clonar)
                    Object.assign(clonado, calculador.clonar(estado));

            estadoClonado.set(problema, clonado);
        }

        return estadoClonado;
    }
}

export default new EstadosService();