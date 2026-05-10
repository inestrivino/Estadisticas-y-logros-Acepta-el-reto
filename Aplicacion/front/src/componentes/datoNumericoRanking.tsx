import { EventType } from "shared";
import { socket } from "../services/socket.ts";
import { useState, useEffect } from "react";

const skeletonKeyframes = `
@keyframes shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}`;

export default function DatoNumericoRanking(props: {
    usuario: string,
    dimensiones: { width: number; height: number },
    dato: { value: number; description: string }
    style?: React.CSSProperties;
    loading?: boolean;
}) {
    //se colocan los datos con un useState para actualizarlos si llega un mensaje por el socket
    const [data, setData] = useState<number>(() => {
        let inicial: number = props.dato.value;
        if (inicial % 1 !== 0)
            inicial = parseFloat(inicial.toFixed(3));
        return inicial;
    });

    //sincroniza el estado cuando el dato inicial llega desde el padre (tras el fetch)
    useEffect(() => {
        if (props.loading) return;
        setData(() => {
            let val = props.dato.value;
            if (val % 1 !== 0) val = parseFloat(val.toFixed(3));
            return val;
        });
    }, [props.dato.value, props.loading]);

    //se actualiza el dato cada vez que llega un nuevo mensaje por el socket
    useEffect(() => {
        const handler = (newDato: number) => {
            console.log("RANKING SOCKET: " + newDato);
            fetch(`/api/usuarios/${props.usuario}/posRanking`)
                .then(res => res.json())
                .then(data => {
                    if (data.pos !== -1)
                        setData(data);
                });
        };

        socket.on(EventType.ACTUALIZACION_RANKING, handler);

        //se limpia el listener al desmontar el componente
        return () => {
            socket.off(EventType.ACTUALIZACION_RANKING, handler);
        };
    }, [EventType.ACTUALIZACION_RANKING]);

    const containerStyle: React.CSSProperties = {
        border: "1px solid #86e7ffa8",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        textAlign: "center",
        width: "100%",
        height: `${props.dimensiones.height}px`,
        backgroundColor: "#D9EDF7",
        boxShadow: "0 0 10px #43555c66",
    };

    if (props.loading) {
        return (
            <>
                <style>{skeletonKeyframes}</style>
                <div style={props.style} className="w-full">
                    <div style={{ ...containerStyle, position: "relative", overflow: "hidden" }}>
                        <div style={{
                            position: "absolute",
                            top: 0, left: 0,
                            width: "100%", height: "100%",
                            background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.53) 70%, transparent 100%)",
                            animation: "shimmer 2s infinite",
                        }} />
                    </div>
                </div>
            </>
        );
    }

    return (
        <div style={props.style} className="w-full">
            <div style={containerStyle}>
                <div style={{ fontSize: "28px", fontWeight: "bold" }}> # {data} </div>
                <div style={{ fontSize: "14px", color: "#555" }}> {props.dato.description} </div>
            </div>
        </div>
    );
}