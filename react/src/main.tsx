import { createRoot } from "react-dom/client";
import { PruebaSocket } from "./pruebaSocket.js";
import { Diagrama } from "./diagrama.js";

const domNode = document.getElementById("diagramas");
if (domNode) {
    const root = createRoot(domNode);
    root.render(
        <>
            <Diagrama
                evento="reload-diagrama1" 
                dimensiones={{ width: 250, height: 250, outerRadius: 75}} 
                colores={["#7947cfff", "#35d0bcff", "#df9350ff"]} 
                datos={[{name:"dato1", value:10}, {name:"dato2", value:10}]}
            />
            <Diagrama
                evento="reload-diagrama2" 
                dimensiones={{ width: 250, height: 250, outerRadius: 75 }} 
                colores={["#7947cfff", "#35d0bcff", "#df9350ff"]} 
                datos={[{name:"dato1", value:10}, {name:"dato2", value:10}]}
            />
        </>
    );
}

const domNode2 = document.getElementById("prueba-socket");
if (domNode2) {
    const root2 = createRoot(domNode2);
    root2.render(
        <>
            <PruebaSocket/>
        </>
    );
}