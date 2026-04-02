import { socket } from "../services/socket.ts";
import { useState, useEffect } from "react";

export default function DatoNumerico(props: {
    evento: string,
    dimensiones: { width: number; height: number },
    dato: { value: number; description: string }
    style?: React.CSSProperties;
}) {
    //se colocan los datos con un useState para actualizarlos si llega un mensaje por el socket
    const [data, setData] = useState<number>(() => {
        let inicial: number = props.dato.value;
        if (inicial % 1 !== 0)
            inicial = parseFloat(inicial.toFixed(3));
        return inicial;
    });

    //se actualiza el dato cada vez que llega un nuevo mensaje por el socket
    useEffect(() => {
        const handler = (newDato: number) => {
            setData(() => {
                if (newDato % 1 !== 0)
                    newDato = parseFloat(newDato.toFixed(3));
                return newDato;
            });
        };

        socket.on(props.evento, handler);

        //se limpia el listener al desmontar el componente
        return () => {
            socket.off(props.evento, handler);
        };
    }, [props.evento]);

    return (
        <div style={props.style} className="w-full">
            <div style={{
                border: "1px solid #86e7ffa8",
                borderRadius: "12px",
                padding: "16px",
                display: "block",
                textAlign: "center",
                width: "100%",  // ← CAMBIO: 100% en lugar de px fijo
                height: `${props.dimensiones.height}px`,
                backgroundColor: "#D9EDF7",
                boxShadow: "0 0 10px #43555c66",
            }}>
                <div style={{ fontSize: "28px", fontWeight: "bold" }}> {data} </div>
                <div style={{ fontSize: "14px", color: "#555" }}> {props.dato.description} </div>
            </div>
        </div>
    );
}