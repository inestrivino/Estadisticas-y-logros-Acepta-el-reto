import { createRoot } from "react-dom/client";
import { PruebaSocket } from "./componentes/pruebaSocket.tsx";
import { Diagrama } from "./componentes/diagrama.tsx";
import { EventType } from "@/server/sockets/socketEventTypes.ts";

const domNode = document.getElementById("diagramas");
if (domNode)
    renderPaginaDiagramas(domNode);

async function renderPaginaDiagramas(domNode: HTMLElement) {
    const root = createRoot(domNode);
    root.render(
        <>
            <Diagrama
                evento={EventType.DIAGRAMA_PROBLEMAS}
                dimensiones={{ width: 400, height: 400, outerRadius: 75 }}
                colores={[
                    "#7947CF","#35D0BC","#DF9350","#4F8EF7",
                    "#E84C88","#6BCF63","#F2C94C","#b351e0",
                    "#EB5757","#56CCF2","#2F80ED",
                ]}
                datos={
                    await fetch("/api/problemas").then((response) => response.json())
                }
            />
        </>
    );
}

const domNode2 = document.getElementById("prueba-socket");
if (domNode2) {
    const root2 = createRoot(domNode2);
    root2.render(
        <>
            <PruebaSocket />
        </>
    );
}