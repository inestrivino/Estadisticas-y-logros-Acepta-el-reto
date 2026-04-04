import { EstadoUsuario } from "./EstadoUsuario.js";

class EstadoServicio {
    private estados = new Map<string, EstadoUsuario>();

    getEstados(): [string, EstadoUsuario][] {
        return Array.from(this.estados.entries());
    }

    getEstado(usuario: string): EstadoUsuario {
        if (!this.estados.has(usuario)) {
            this.estados.set(usuario, this.initEstado());
        }
        return this.estados.get(usuario)!;
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
        this.estados.clear();
    }
}

export default new EstadoServicio();