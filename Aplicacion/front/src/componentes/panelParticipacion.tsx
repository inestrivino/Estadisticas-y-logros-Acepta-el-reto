import { socket } from "../services/socket.ts";
import { useEffect, useState } from "react";

export default function PanelParticipacion(props: {
    evento: string,
    inicioSemana: number,
    datos: { timeStamp: number, value: number }[],
    colores: string[], //5 colores ordenados de mas envios a menos envios
}) {
    //se colocan los datos con un useState para actualizarlos si llega un mensaje por el socket
    const [data, setData] = useState<{ timeStamp: number, value: number }[]>(() => {
        return props.datos;
    });

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
    }, []);

    const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

    //funcion que te devuelve el color acorde a la cantidad de envios
    function getColor(dia: number): string {
        if (props.datos[dia].value === 0)
            return props.colores[4];

        else if (props.datos[dia].value >= 1 && props.datos[dia].value < 2)
            return props.colores[3];

        else if (props.datos[dia].value >= 2 && props.datos[dia].value < 6)
            return props.colores[2];

        else if (props.datos[dia].value >= 6 && props.datos[dia].value < 10)
            return props.colores[1];

        else if (props.datos[dia].value > 9)
            return props.colores[0];

        return "null";
    }

    function cuadrado(dia: number, color?: string) {
        if (color === undefined)
            color = getColor(dia)
        return (
            <div
                style={{
                    borderRadius: "20%",
                    background: color
                }}
            />
        )
    }
    let cuadrados = [];

    // primera semana
    for (let i = 0; i < 7; i++) {
        if (i < props.inicioSemana) {
            cuadrados.push(cuadrado(i, "#fbfbfb00"))
        } else {
            cuadrados.push(cuadrado(i))
        }
    }

    // resto de semanas
    for (let i = 7; i < 51 * 7; i++) {
        cuadrados.push(cuadrado(i))
    }

    // ultima semana
    let j = 0;
    for (let i = 51 * 7; i < 51 * 7 + 8; i++) {
        if (j >= props.inicioSemana) {
            cuadrados.push(cuadrado(i, "#fbfbfb00"))
        } else {
            cuadrados.push(cuadrado(i))
        }
        j++;
    }

    return (
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
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(53, calc((83cqw) / 53)",
                gridTemplateRows: "repeat(7, calc((83cqw) / 53))",
                gap: "0.3cqw",
                gridAutoFlow: "column",
            }}>
                {cuadrados}
            </div>
        </div>
    );
}