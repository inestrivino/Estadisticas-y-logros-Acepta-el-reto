//import { socket } from "../socket.ts";
import { useState, useEffect } from "react";

export function DatoNumerico(props: {
    evento: string,
    dimensiones: { width: number; height: number },
    dato: { value: number; description: string }
    style?: React.CSSProperties;
}) {
    //se colocan los datos con un useState para actualizarlos si llega un mensaje por el socket
    const [data, setData] = useState<number>(() => {
        const inicial: number = props.dato.value;
        return inicial;
    });

    //se actualiza el dato cada vez que llega un nuevo mensaje por el socket
    /*useEffect(() => {
        socket.on(props.evento, (newDato: string) => {
            setData(Number(newDato));
        });

        //se limpia el listener al desmontar el componente
        return () => {
            socket.off(props.evento);
        };
    }, [props.evento]);*/

    return (
        <div style={props.style}>
            <div style={{ //caja del elemento
                //border: "1px solid #ccc",
                borderRadius: "12px",
                padding: "16px",
                margin: "5px",
                display: "inline-block",
                textAlign: "center",
                width: `${props.dimensiones.width}px`,
                height: `${props.dimensiones.height}px`,
                backgroundColor: "#D9EDF7"
            }}>
                <div style={{ fontSize: "28px", fontWeight: "bold" }}> {data} </div>
                <div style={{ fontSize: "14px", color: "#555" }}> {props.dato.description} </div>
            </div>
        </div>
    );
}