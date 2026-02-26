import { useState } from "react";

export default function PruebaSocketComponent() {

    const [resultado, setResultado] = useState("AC");

    async function enviarAceptado() {
        const aux = {
            "id": 1,
            "usuario": "user8",
            "problema": "problema1",
            "resultado": resultado,
            "lenguaje": "cpp",
            "tiempo": 0.936,
            "memoria": 4258,
            "pos": 62,
            "fecha": "2024-05-05"
        }

        const body = JSON.stringify(aux);
        await fetch("/api/nuevo", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: body
        });

    }

    return (
        <>
            <select value={resultado} onChange={(e) => setResultado(e.target.value)}>
                <option value="AC">Aceptado</option>
                <option value="PE">Error</option>
                <option value="WA">Incorrecto</option>
                <option value="CE">Error de compilación</option>
                <option value="RTE">Error durante la ejecución</option>
                <option value="TLE">Tiempo límite</option>
                <option value="MLE">Límite de memoria</option>
                <option value="OLE">Límite de salida</option>
                <option value="RF">Función restringida</option>
                <option value="IQ">En cola</option>
                <option value="IE">Error interno</option>
            </select>

            <br /><br />
            <button onClick={enviarAceptado}>Enviar</button>
            <br /><br />
        </>
    );
}