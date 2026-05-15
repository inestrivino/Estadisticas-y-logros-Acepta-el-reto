import { socket } from "../services/socket.ts";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function PanelParticipacion(props: {
    evento: string,
    datos: { timeStamp: number, value: number }[],
    colores: string[], //5 colores ordenados de mas envios a menos envios
}) {

    //se colocan los datos con un useState para actualizarlos si llega un mensaje por el socket
    const [data, setData] = useState<{ timeStamp: number, value: number }[]>(() => {
        return props.datos;
    });

    const [tooltip, setTooltip] = useState<{ x: number, y: number, value: number, fecha: string } | null>(null);

    //se actualiza el dato cada vez que llega un nuevo mensaje por el socket
    useEffect(() => {
        const handler = (newDatos: { timeStamp: number, value: number }[]) => {
            setData(() => {
                return newDatos;
            });
        };

        socket.on(props.evento, handler);

        //se limpia el listener al desmontar el componente
        return () => {
            socket.off(props.evento, handler);
        };
    }, [props.evento]);

    //numero del 0 al 6 que representa el dia de la semana del lunes = 0, al domingo = 6
    let inicioSemana = new Date().getDay() - 1;
    if (inicioSemana === -1)
        inicioSemana = 6;

    const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

    //funcion que te devuelve el color acorde a la cantidad de envios
    function getColor(dia: number): string {
        if (data[dia].value === 0)
            return props.colores[4];

        else if (data[dia].value >= 1 && data[dia].value < 2)
            return props.colores[3];

        else if (data[dia].value >= 2 && data[dia].value < 6)
            return props.colores[2];

        else if (data[dia].value >= 6 && data[dia].value < 10)
            return props.colores[1];

        else if (data[dia].value > 9)
            return props.colores[0];

        return "null";
    }

    let contadorVacios = 0;
    function cuadradoVacio() {
        return (
            <div
                key={contadorVacios++}
                style={{ borderRadius: "20%", background: "#fbfbfb00" }}
            />
        );
    }

    function cuadrado(dia: number) {
        const color = getColor(dia);
        const entry = data[dia];
        const fecha = entry ? new Date(entry.timeStamp * 1000).toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "UTC" }) : "";
        const envios = entry ? entry.value : 0;
        return (
            <div
                key={dia}
                style={{ borderRadius: "20%", background: color, cursor: "pointer" }}
                onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, value: envios, fecha })}
                onMouseMove={(e) => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
            />
        );
    }
    let cuadrados = [];


    for (let i = 0; i < inicioSemana; i++) {
        cuadrados.push(cuadradoVacio());
    }

    // resto de semanas
    for (let i = 0; i < 365; i++) {
        cuadrados.push(cuadrado(i))
    }

    return (
        <>
            {tooltip !== null && createPortal(
                <div style={{
                    position: "fixed",
                    left: tooltip.x + 12,
                    top: tooltip.y + 12,
                    background: "#D9EDF7",
                    border: "1px solid #86e7ffa8",
                    borderRadius: "8px",
                    padding: "4px 10px",
                    fontSize: "0.8rem",
                    color: "#0c527a",
                    fontWeight: 600,
                    pointerEvents: "none",
                    zIndex: 1000,
                    whiteSpace: "nowrap",
                }}>
                    {tooltip.fecha} — {tooltip.value} envíos
                </div>,
                document.body
            )}
            <div style={{
                width: "100%",
                containerType: "inline-size",
                display: "inline-flex",
                alignItems: "flex-start",
                background: "#D9EDF7",
                border: "1px solid #86e7ffa8",
                padding: "0.5cqw",
                borderRadius: "10px",
                gap: "clamp(2px, 0.5cqw, 6px)",
                boxShadow: "0 0 10px #43555c66",
            }}>
                {/* Columna de etiquetas de días */}
                <div style={{
                    display: "grid",
                    gridTemplateRows: "repeat(7, calc((80cqw) / 53))",
                    gap: "0.3cqw",
                    flexShrink: 0,
                }}>
                    {dias.map((dia) => (
                        <div
                            key={dia}
                            style={{
                                fontSize: "calc((83cqw) / 53 * 0.8)",
                                color: "#0c527a",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                whiteSpace: "nowrap",
                                lineHeight: 1,
                            }}
                        >
                            {dia}
                        </div>
                    ))}
                </div>

                {/* Grid de cuadrados */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(54, calc((82cqw) / 54))",
                        gridTemplateRows: "repeat(7, calc((82cqw) / 54))",
                        gap: "0.3cqw",
                        gridAutoFlow: "column",
                    }}
                    onMouseLeave={() => setTooltip(null)}
                >
                    {cuadrados}
                </div>
            </div>
        </>
    );
}
