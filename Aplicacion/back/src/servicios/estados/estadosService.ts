import { EnvioProcesado } from "../../types/envioProcesado.js";
import { EstadoProblema } from "../../types/estadoProblema.js";
import { EstadoUsuario } from "../../types/estadoUsuario.js";
import estadosBaseService from "./estadosBaseService.js";


class EstadosService {

    private estadosUsuarios: Map<string, EstadoUsuario> = new Map();
    private estadosProblemas: Map<string, EstadoProblema> = new Map();

    public async getEstadosIniciales( usuarios: Set<string>, problemas: Set<string>) {

        //crea los estados vacios para los usuarios y problemas
        for (const usuario of usuarios) {
            this.estadosUsuarios.set(usuario, this.estadoVacioUsuario());
        }
        for (const problema of problemas) {
            this.estadosProblemas.set(problema, this.estadoVacioProblema());
        }

        //se pasa por todos los servicios que deben cargar datos iniciales
        await estadosBaseService.getEstadosIniciales(this.estadosUsuarios, this.estadosProblemas);

        return {
            estadosUsuariosIniciales: this.clonarEstadosUsuarios(this.estadosUsuarios),
            estadosProblemasIniciales: this.clonarEstadosProblemas(this.estadosProblemas)
        }
    }

    public async * getEstadosActualizados(envios: EnvioProcesado[]) {
        for (const envio of envios) {

            const estadoUsuario = this.estadosUsuarios.get(envio.usuario)!;
            const estadoProblema = this.estadosProblemas.get(envio.problema)!;

            //se pasa por todos los servicios que deben actualizar los estados con el nuevo envio
            estadosBaseService.getEstadosActualizados(estadoUsuario, estadoProblema, envio);

            //se devuelven los mapas actualizados junto con el envio
            yield {
                estadosUsuarios: this.estadosUsuarios,
                estadosProblemas: this.estadosProblemas,
                envio
            };
        }
    }

    /**
     * Crea un estado de usuario vacio con todos los contadores a cero.
     * @returns Estado inicial del usuario.
     */
    private estadoVacioUsuario(): EstadoUsuario {
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
     * Crea un estado de problema vacio con todos los contadores a cero.
     * @returns Estado inicial del problema.
     */
    private estadoVacioProblema(): EstadoProblema {
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