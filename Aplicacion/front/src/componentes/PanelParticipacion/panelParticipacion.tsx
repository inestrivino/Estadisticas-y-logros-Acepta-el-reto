import { socket } from "../../services/socket.ts";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Skeleton from "../Skeleton/skeleton.tsx";
import "./panelParticipacion.css";

export default function PanelParticipacion(props: {
    evento: string,
    datos: { timeStamp: number, value: number }[],
    colores: string[], //5 colores ordenados de mas envios a menos envios
    loading?: boolean,
}) {

    //el dato base viene de las props, si llega una actualizacion por socket prevalece hasta nuevo cambio de props
    const [socketData, setSocketData] = useState<{ timeStamp: number, value: number }[] | null>(null);

    const [tooltip, setTooltip] = useState<{ x: number, y: number, value: number, fecha: string } | null>(null);

    //se actualiza el dato cada vez que llega un nuevo mensaje por el socket
    useEffect(() => {
        const handler = (newDatos: { timeStamp: number, value: number }[]) => setSocketData(newDatos);
        socket.on(props.evento, handler);
        return () => { socket.off(props.evento, handler); };
    }, [props.evento]);

    useEffect(() => { setSocketData(null); }, [props.datos]);

    const data = socketData ?? props.datos;

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
                key={`vacio-${contadorVacios++}`}
                className="panel-participacion-celda panel-participacion-celda-vacia"
            />
        );
    }

    function calcPosTooltip(x: number, y: number): { x: number, y: number } {
        const margin = 12;
        const tooltipW = 180; //ancho aprox del tooltip
        const tooltipH = 36; //alto aprox del tooltip

        let tx = x + margin;
        let ty = y + margin;

        if (tx + tooltipW > window.innerWidth)
            tx = x - tooltipW - margin;

        if (ty + tooltipH > window.innerHeight)
            ty = y - tooltipH - margin;

        return { x: tx, y: ty };
    }

    function cuadrado(dia: number) {
        const color = getColor(dia);
        const entry = data[dia];
        const fecha = entry ? new Date(entry.timeStamp * 1000).toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "UTC" }) : "";
        const envios = entry ? entry.value : 0;
        return (
            <div
                key={`dia-${dia}`}
                className="panel-participacion-celda panel-participacion-celda-llena"
                style={{ background: color }}
                onMouseEnter={(e) => {
                    const pos = calcPosTooltip(e.clientX, e.clientY);
                    setTooltip({ x: pos.x, y: pos.y, value: envios, fecha });
                }}
                onMouseMove={(e) => {
                    const pos = calcPosTooltip(e.clientX, e.clientY);
                    setTooltip(t => t ? { ...t, x: pos.x, y: pos.y } : null);
                }}
            />
        );
    }
    let cuadrados = [];

    //solo se construyen los cuadrados si los datos ya estan cargados (y sincronizados al estado),
    //en otro caso se mostraria el skeleton
    if (!props.loading && data.length > 0) {
        for (let i = 0; i < inicioSemana; i++) {
            cuadrados.push(cuadradoVacio());
        }

        // resto de semanas
        for (let i = 0; i < data.length; i++) {
            cuadrados.push(cuadrado(i))
        }
    }

    return (
        <>
            {tooltip !== null && createPortal(
                <div className="panel-participacion-tooltip" style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}>
                    {tooltip.fecha} — {tooltip.value} envíos
                </div>,
                document.body
            )}
            <div className="panel-participacion-scroll-wrapper">
                <Skeleton loading={props.loading} className="panel-participacion-container">
                    {/* Columna de etiquetas de dias */}
                    <div className="panel-participacion-dias">
                        {dias.map((dia) => (
                            <div key={dia} className="panel-participacion-dia">
                                {dia}
                            </div>
                        ))}
                    </div>

                    {/* Grid de cuadrados */}
                    <div
                        className="panel-participacion-grid"
                        onMouseLeave={() => setTooltip(null)}
                    >
                        {cuadrados}
                    </div>
                </Skeleton>
            </div>

        </>
    );
}
