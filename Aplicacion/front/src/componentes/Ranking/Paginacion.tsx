import { useState } from "react";

/**
 * Paginacion con numeros de pagina, flechas, un input para ir a una pagina concreta
 * y un boton para saltar a la pagina del usuario seleccionado.
 */
export default function Paginacion(props: {
    pag: number,
    totalPags: number,
    setPag: (n: number) => void,
    usuario: string,
    onIrAUsuario: () => void,
}) {
    const { pag, totalPags, setPag, usuario, onIrAUsuario } = props;
    //valor del input "Ir a", se mantiene como string para permitir vacio
    const [destino, setDestino] = useState("");

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

            {/* atajo para saltar a la pagina en la que aparece el usuario seleccionado */}
            <button
                className="ranking-page-btn"
                onClick={onIrAUsuario}
                disabled={!usuario}
                title={usuario ? `Ir a la pagina de ${usuario}` : "Selecciona un usuario para usar este boton"}
            >
                Ir a usuario
            </button>
        </div>
    );
}
