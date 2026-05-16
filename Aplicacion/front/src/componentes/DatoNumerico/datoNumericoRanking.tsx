import { EventType } from "shared";
import { socket } from "../../services/socket.ts";
import { useState, useEffect } from "react";
import Skeleton from "../Skeleton/skeleton.tsx";
import "./datoNumerico.css";

/**
 * Variante de DatoNumerico para la posicion en el ranking del usuario. Antepone
 * el caracter '#' al valor y refresca el dato consultando la API al recibir el
 * evento de actualizacion del ranking por socket.
 */
export default function DatoNumericoRanking(props: {
    usuario: string,
    dimensiones: { width: number; height: number },
    dato: { value: number; description: string }
    style?: React.CSSProperties;
    loading?: boolean;
}) {
    //el dato base viene de las props, si llega una actualizacion por socket se refetchea y prevalece sobre las props
    const [socketData, setSocketData] = useState<number | null>(null);

    useEffect(() => {
        const handler = () => {
            fetch(`/api/usuarios/${props.usuario}/posRanking`)
                .then(res => res.json())
                .then(data => {
                    if (data.pos !== -1)
                        setSocketData(data);
                });
        };
        socket.on(EventType.ACTUALIZACION_RANKING, handler);
        return () => { socket.off(EventType.ACTUALIZACION_RANKING, handler); };
    }, [props.usuario]);

    useEffect(() => { setSocketData(null); }, [props.dato.value]);

    const valor = socketData ?? props.dato.value;
    const data = valor % 1 !== 0 ? parseFloat(valor.toFixed(3)) : valor;

    const alturaStyle = { height: `${props.dimensiones.height}px` };

    return (
        <div style={props.style} className="w-full">
            <Skeleton loading={props.loading} className="dato-numerico-container" style={alturaStyle}>
                <p className="dato-numerico-titulo">{props.dato.description}</p>
                <div className="dato-numerico-valor-wrapper">
                    <div className="dato-numerico-valor"># {data}</div>
                </div>
            </Skeleton>
        </div>
    );
}
