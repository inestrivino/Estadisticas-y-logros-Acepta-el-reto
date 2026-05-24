import { EstadoUsuario } from "../../types/estados/estadoUsuario.js";
import { Logro } from "../logros/logro.js";
import { Pipeline } from "../../dao/DAO.js";
import { CampoUsuarioKey } from "../../types/estados/camposEstadoUsuario.js";

/**
 * Estadistica que contribuye a la experiencia del usuario.
 * Cada estadistica sabe (1) cuanta XP aporta a partir del cambio de estado y los
 * logros nuevos del periodo y, opcionalmente, (2) como persistirse por mes.
 */
export interface EstadisticaExperiencia {
    id: CampoUsuarioKey;

    /**
     * Puntos de XP que esta estadistica aporta al usuario en el periodo cubierto
     * entre `estadoInicial` y `estadoFinal`, considerando los logros nuevos.
     */
    calcularXP(
        estadoInicial: EstadoUsuario,
        estadoFinal: EstadoUsuario,
        nuevosLogros: Set<Logro>
    ): number;

    /**
     * Encola en el pipeline la persistencia del cambio que ha experimentado esta
     * estadistica para (usuario, mes), comparando el estado final del mes anterior
     * dentro del bloque (o el inicial si es el primer mes) con el final del mes actual.
     * Opcional: si una estadistica no necesita persistencia por mes se omite.
     */
    registrarMes(
        pipeline: Pipeline,
        usuario: string,
        mes: number,
        estadoAnterior: EstadoUsuario,
        estadoFinalMes: EstadoUsuario,
        nuevosLogrosMes: Set<Logro>
    ): void;

    /**
     * Borra de la base de datos los datos mensuales de esta estadistica para
     * todos los usuarios.
     */
    borrarMes(): Promise<void>;

    /**
     * Calcula la XP que aporta esta estadistica en el mes indicado a partir
     * de los datos mensuales persistidos en la base de datos.
     * @param mes - Mes (0-11) a consultar.
     * @returns Mapa de usuario a XP aportada por esta estadistica en ese mes.
     */
    calcularXPMes(mes: number): Promise<Map<string, number>>;
}
