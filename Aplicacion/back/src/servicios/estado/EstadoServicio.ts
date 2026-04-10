import { EstadoProblema } from "./estadoProblema.js";
import { EstadoUsuario } from "./EstadoUsuario.js";

class EstadoServicio {
    private estadosUsuarios = new Map<string, EstadoUsuario>();
    private estadosProblemas = new Map<string, EstadoProblema>();

    getEstadosUsuarios(): [string, EstadoUsuario][] {
        return Array.from(this.estadosUsuarios.entries());
    }
    
    getEstadoUsuario(usuario: string): EstadoUsuario {
        if (!this.estadosUsuarios.has(usuario)) {
            this.estadosUsuarios.set(usuario, this.initEstado());
        }
        return this.estadosUsuarios.get(usuario)!;
    }

    getEstadoProblema(problema: string): EstadoProblema {
        if (!this.estadosProblemas.has(problema)) {
            this.estadosProblemas.set(problema, {});
        }
        return this.estadosProblemas.get(problema)!;
    }

    private initEstado(): EstadoUsuario {
        return {
            numEnvios: 0,
            numProblemasResueltos: 0,
            lenguajesProblemasResueltos: new Map<string, number>(),
            lenguajes: new Set(),
            logros: new Set(),
            rachaEnviosAC: 0, //TODO a lo mejor esto tendria que aparecer tambien los problemas, para que no se pueda conseguir enviando 5 veces la misma solucion
            rachaDiasEnvio: 0, //guarda los dias
            //categoriaProblemasResueltos: new Set(), TODO categorias problemas
            franjasHorarias: new Set()
        }
    }

    clear() {
        this.estadosUsuarios.clear();
        this.estadosProblemas.clear();
    }
}

export default new EstadoServicio();