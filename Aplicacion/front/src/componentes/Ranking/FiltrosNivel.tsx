import { NivelUsuario } from "shared";
import { NIVELES_FILTRO, colorDelNivel, colorTextoDelNivel } from "./utils.ts";
import "./ranking.css";

/**
 * Chips para filtrar el ranking por nivel. Incluye un boton extra para filtrar
 * por el nivel del usuario seleccionado.
 */
export default function FiltrosNivel(props: {
    nivelActual: string,
    onCambio: (nuevoNivel: string) => void,
    usuario: string,
    nivelUsuario: NivelUsuario,
}) {
    const { nivelActual, onCambio, usuario, nivelUsuario } = props;

    //sin usuario seleccionado o sin nivel valido se desactiva el chip de "filtrar por mi nivel"
    const sinUsuario = !usuario || nivelUsuario === NivelUsuario.SIN_NIVEL;
    const activoNivelUsuario = !sinUsuario && nivelActual === nivelUsuario;

    return (
        <div className="ranking-controles">
            <div className="ranking-filtros">
                {/* chip especial: filtra por el nivel del usuario actualmente seleccionado */}
                <button
                    className={`ranking-chip ${activoNivelUsuario ? "activo" : ""}`}
                    onClick={() => onCambio(nivelUsuario)}
                    disabled={sinUsuario}
                    title={sinUsuario ? "Selecciona un usuario para usar este filtro" : `Filtrar por el nivel de ${usuario}`}
                    style={{
                        marginRight: "1rem",
                        //si esta activo, se pinta con el color del nivel correspondiente
                        ...(activoNivelUsuario && { background: colorDelNivel(nivelUsuario), borderColor: colorDelNivel(nivelUsuario), color: colorTextoDelNivel(nivelUsuario) }),
                    }}
                >
                    {sinUsuario ? "—" : usuario}
                </button>
                {/* un chip por cada nivel posible (mas el chip "Todos" con value vacio) */}
                {NIVELES_FILTRO.map(nivel => (
                    <button
                        key={nivel.value || "todos"}
                        className={`ranking-chip ${nivelActual === nivel.value ? "activo" : ""}`}
                        onClick={() => onCambio(nivel.value)}
                        style={nivel.value && nivelActual === nivel.value ? { background: colorDelNivel(nivel.value), borderColor: colorDelNivel(nivel.value), color: colorTextoDelNivel(nivel.value) } : undefined}
                    >
                        {nivel.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
