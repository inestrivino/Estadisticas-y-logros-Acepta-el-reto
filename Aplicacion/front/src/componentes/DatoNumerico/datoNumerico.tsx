import { socket } from "../../services/socket.ts";
import { useState, useEffect } from "react";
import Skeleton from "../Skeleton/skeleton.tsx";
import "./datoNumerico.css";

/**
 * Muestra un valor numerico con su descripcion arriba y el valor grande centrado debajo.
 * Se actualiza por socket.
 */
export default function DatoNumerico(props: {
    evento: string,
    dimensiones: { width: number; height: number },
    dato: { value: number; description: string }
    style?: React.CSSProperties;
    loading?: boolean;
}) {
    //el dato base viene de las props, si llega una actualizacion por socket prevalece hasta nuevo cambio de props
    const [socketData, setSocketData] = useState<number | null>(null);

    useEffect(() => {
        const handler = (newDato: number) => setSocketData(newDato);
        socket.on(props.evento, handler);
        return () => { socket.off(props.evento, handler); };
    }, [props.evento]);

    useEffect(() => { setSocketData(null); }, [props.dato.value]);

    const valor = socketData ?? props.dato.value;
    const data = valor % 1 !== 0 ? parseFloat(valor.toFixed(3)) : valor;

    const alturaStyle = { height: `${props.dimensiones.height}px` };

    return (
        <div style={props.style} className="w-full">
            <Skeleton loading={props.loading} className="dato-numerico-container" style={alturaStyle}>
                <p className="dato-numerico-titulo">{props.dato.description}</p>
                <div className="dato-numerico-valor-wrapper">
                    <div className="dato-numerico-valor">{data}</div>
                </div>
            </Skeleton>
        </div>
    );
}
