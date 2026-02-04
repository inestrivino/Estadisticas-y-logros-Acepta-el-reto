import { createRoot } from "react-dom/client";
import { Contador } from "./contador.js";
import { EjemploRecharts } from "./diagramaSectores.js";
import { PruebaSocket } from "./pruebaSocket.js";

const domNode = document.getElementById("root");
if (domNode) {
    const root = createRoot(domNode);
    root.render(
        <>
            <EjemploRecharts valor1={400} valor2={500} valor3={400}/>
            <EjemploRecharts valor1={100} valor2={333} valor3={400}/>
        </>
    );
}

const domNode2 = document.getElementById("diagrama");
if (domNode2) {
    const aux2 = createRoot(domNode2);
    aux2.render(
        <>
            <PruebaSocket/>
            <EjemploRecharts valor1={300} valor2={50} valor3={400}/>
        </>
        
    );
}