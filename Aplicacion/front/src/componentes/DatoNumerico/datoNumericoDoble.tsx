import { socket } from "../../services/socket.ts";
import { useState, useEffect } from "react";
import Skeleton from "../Skeleton/skeleton.tsx";
import "./datoNumerico.css";

type Dato = {
    evento: string,
    value: number,
    label: string,
};

/**
 * Variante de DatoNumerico que muestra un titulo comun arriba y dos valores numericos
 * abajo, cada uno con su propia etiqueta corta. Cada valor se actualiza por su propio
 * evento de socket.
 */
export default function DatoNumericoDoble(props: {
    dimensiones: { width: number; height: number },
    titulo: string,
    izquierda: Dato,
    derecha: Dato,
    style?: React.CSSProperties,
    loading?: boolean,
}) {

    const normalizar = (val: number) => val % 1 !== 0 ? parseFloat(val.toFixed(3)) : val;

    //los datos base vienen de las props, si llegan actualizaciones por socket prevalecen hasta nuevo cambio de props
    const [socketIzq, setSocketIzq] = useState<number | null>(null);
    const [socketDer, setSocketDer] = useState<number | null>(null);

    useEffect(() => {
        const handlerIzq = (nuevo: number) => setSocketIzq(nuevo);
        const handlerDer = (nuevo: number) => setSocketDer(nuevo);
        socket.on(props.izquierda.evento, handlerIzq);
        socket.on(props.derecha.evento, handlerDer);
        return () => {
            socket.off(props.izquierda.evento, handlerIzq);
            socket.off(props.derecha.evento, handlerDer);
        };
    }, [props.izquierda.evento, props.derecha.evento]);

    useEffect(() => { setSocketIzq(null); }, [props.izquierda.value]);
    useEffect(() => { setSocketDer(null); }, [props.derecha.value]);

    const izq = normalizar(socketIzq ?? props.izquierda.value);
    const der = normalizar(socketDer ?? props.derecha.value);

    const alturaStyle = { height: `${props.dimensiones.height}px` };

    return (
        <div style={props.style} className="w-full">
            <Skeleton loading={props.loading} className="dato-numerico-container" style={alturaStyle}>
                <p className="dato-numerico-titulo">{props.titulo}</p>
                <div className="dato-numerico-doble-fila">
                    <div className="dato-numerico-doble-mitad">
                        <div className="dato-numerico-doble-valor">{izq}</div>
                        <div className="dato-numerico-doble-label">{props.izquierda.label}</div>
                    </div>
                    <div className="dato-numerico-doble-separador" />
                    <div className="dato-numerico-doble-mitad">
                        <div className="dato-numerico-doble-valor">{der}</div>
                        <div className="dato-numerico-doble-label">{props.derecha.label}</div>
                    </div>
                </div>
            </Skeleton>
        </div>
    );
}
