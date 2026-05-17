import { useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Paginacion con numeros de pagina, flechas, un input para ir a una pagina concreta
 * y un boton para saltar a la pagina del usuario seleccionado.
 * @param props.fueraDeFiltro - True si el usuario seleccionado no pertenece al nivel filtrado actual,
 *   en cuyo caso el boton "Ir a usuario" se deshabilita y se muestra un aviso.
 * @param props.nivelFiltro - Nombre del nivel filtrado actual, usado en el mensaje de aviso.
 */
export default function Paginacion(props: {
    pag: number,
    totalPags: number,
    setPag: (n: number) => void,
    usuario: string,
    onIrAUsuario: () => void,
    fueraDeFiltro?: boolean,
    nivelFiltro?: string,
}) {
    const { pag, totalPags, setPag, usuario, onIrAUsuario, fueraDeFiltro, nivelFiltro } = props;
    //valor del input "Ir a", se mantiene como string para permitir vacio
    const [destino, setDestino] = useState("");

    //aviso al pasar por encima el boton de ir a usuario saber que no se puede
    const [avisoPos, setAvisoPos] = useState<{ x: number, y: number } | null>(null);
    const avisoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /** Cancela cualquier cierre pendiente del popover de aviso. */
    const cancelarCierreAviso = () => {
        if (avisoTimeoutRef.current) {
            clearTimeout(avisoTimeoutRef.current);
            avisoTimeoutRef.current = null;
        }
    };

    /** Abre el popover de aviso anclado encima del boton. */
    const abrirAviso = (e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>) => {
        cancelarCierreAviso();
        const rect = e.currentTarget.getBoundingClientRect();
        //x al centro horizontal del boton, y justo encima, el popover se centra y sube con translate(-50%,-100%) en css
        setAvisoPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    };

    /** Programa el cierre del popover de aviso con margen para cruzar al popover sin que se cierre. */
    const cerrarAviso = () => {
        cancelarCierreAviso();
        avisoTimeoutRef.current = setTimeout(() => setAvisoPos(null), 100);
    };

    //salta a la pagina escrita en el input si es un numero valido dentro del rango
    const irA = () => {
        const n = parseInt(destino);
        if (!isNaN(n) && n >= 1 && n <= totalPags) {
            setPag(n);
            setDestino("");
        }
    };

    //construye la lista de paginas a mostrar: siempre la 1 y la ultima, la actual con una ventana a cada lado,
    //y "..." cuando hay huecos entre los bloques
    const paginas: (number | "...")[] = [];
    const ventana = 1;
    const incluir = (n: number) => paginas.indexOf(n) === -1 && paginas.push(n);
    incluir(1);
    if (pag - ventana > 2) paginas.push("...");
    for (let i = Math.max(2, pag - ventana); i <= Math.min(totalPags - 1, pag + ventana); i++) incluir(i);
    if (pag + ventana < totalPags - 1) paginas.push("...");
    if (totalPags > 1) incluir(totalPags);

    return (
        <div className="ranking-paginacion">
            {/* flecha anterior */}
            <button className="ranking-page-btn" onClick={() => setPag(pag - 1)} disabled={pag === 1}>‹</button>
            {/* numeros de pagina o elipsis */}
            {paginas.map((pagina, i) =>
                pagina === "..."
                    ? <span key={`e-${i}`} className="ranking-page-elipsis">…</span>
                    : <button
                        key={pagina}
                        className={`ranking-page-btn ${pagina === pag ? "activo" : ""}`}
                        onClick={() => setPag(pagina as number)}
                    >{pagina}</button>
            )}
            {/* flecha siguiente */}
            <button className="ranking-page-btn" onClick={() => setPag(pag + 1)} disabled={pag === totalPags}>›</button>

            {/* input para saltar directamente a una pagina concreta */}
            <div className="ir-a-pag">
                <span>Ir a</span>
                <input
                    type="number"
                    min={1}
                    max={totalPags}
                    value={destino}
                    onChange={e => setDestino(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") irA(); }}
                    placeholder={`1-${totalPags}`}
                />
                <button className="ranking-page-btn" onClick={irA} disabled={!destino}>Ir</button>
            </div>

            {/* atajo para saltar a la pagina en la que aparece el usuario seleccionado, deshabilitado si el usuario no pertenece al nivel filtrado, envuelto en un span para capturar el hover aunque el boton este disabled */}
            {/*handlers siempre adjuntos, el aviso solo se abre si el filtro lo desactiva, asi se reacciona cuando fueraDeFiltro cambia con el cursor encima */}
            <span
                onMouseEnter={(e) => { if (usuario && fueraDeFiltro) abrirAviso(e); }}
                onMouseLeave={() => { if (usuario && fueraDeFiltro) cerrarAviso(); }}
            >
                <button
                    className="ranking-page-btn"
                    onClick={onIrAUsuario}
                    disabled={!usuario || fueraDeFiltro}
                >
                    Ir a usuario
                </button>
            </span>
            {avisoPos !== null && createPortal(
                <div
                    className="ranking-popover-flotante ranking-popover-aviso"
                    style={{ left: avisoPos.x, top: avisoPos.y }}
                    onMouseEnter={cancelarCierreAviso}
                    onMouseLeave={cerrarAviso}
                    role="alert"
                >
                    No es {nivelFiltro}
                </div>,
                document.body
            )}
        </div>
    );
}
