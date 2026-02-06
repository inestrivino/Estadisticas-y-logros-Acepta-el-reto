import { createRoot } from "react-dom/client";
import { PruebaSocket } from "./componentes/pruebaSocket.js";
import { Diagrama } from "./componentes/diagrama.js";
import { PruebaRedis } from "./componentes/pruebaRedis.js";

const domNode = document.getElementById("diagramas");
if (domNode) {
    const root = createRoot(domNode);
    root.render(
        <>
            <Diagrama
                evento="reload-diagrama1"
                dimensiones={{ width: 400, height: 400, outerRadius: 75 }}
                colores={[
                    "#7947CF",
                    "#35D0BC", 
                    "#DF9350", 
                    "#4F8EF7", 
                    "#E84C88", 
                    "#6BCF63",
                    "#F2C94C", 
                    "#b351e0", 
                    "#EB5757",
                    "#56CCF2", 
                    "#2F80ED",
                ]}
                datos={[{ name: "dato1", value: 10 }, { name: "dato2", value: 10 }]}
            />
            <PruebaRedis />
            <Diagrama
                evento="reload-diagrama2"
                dimensiones={{ width: 400, height: 400, outerRadius: 75 }}
                colores={["#7947cfff", "#35d0bcff", "#df9350ff"]}
            datos={[{ name: "dato1", value: 10 }, { name: "dato2", value: 10 }]}
            />
        </>
    );
}

const domNode2 = document.getElementById("prueba-socket");
if (domNode2) {
    const root2 = createRoot(domNode2);
    root2.render(
        <>
            <PruebaRedis />
            <PruebaSocket />
        </>
    );
}