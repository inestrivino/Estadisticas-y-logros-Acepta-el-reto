import { socket } from "../../services/socket.js";
import { PieChart, Pie, ResponsiveContainer, Tooltip } from "recharts";
import { useEffect, useState, useRef } from "react";
import Skeleton from "../Skeleton/skeleton.tsx";
import "./diagramaSectores.css";

type DataItem = {
    name: string;
    value: number;
    fill?: string;
};

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ payload: { name: string; value: number; total: number; fill: string } }>;
}

export default function DiagramaSectores(props: {
    evento: string,
    titulo: string,
    datos: { name: string; value: number }[],
    colores: string[],
    dimensiones: { width: number; height: number, outerRadius: number },
    mostrarTotal?: boolean,
    loading?: boolean,
}) {

    const mostrarTotal = props.mostrarTotal ?? false;

    //el dato base viene de las props (fuente de verdad del padre tras el fetch),
    //si llega una actualizacion por socket, prevalece sobre las props hasta que cambien
    const [socketData, setSocketData] = useState<DataItem[] | null>(null);

    useEffect(() => {
        const handler = (newDatos: DataItem[]) => setSocketData(newDatos);
        socket.on(props.evento, handler);
        return () => { socket.off(props.evento, handler); };
    }, [props.evento]);

    //al cambiar las props.datos (nuevo fetch del padre) se descarta lo recibido por socket previo
    useEffect(() => { setSocketData(null); }, [props.datos]);

    const baseData = socketData ?? props.datos;
    const data: DataItem[] = baseData.map((d, i) => ({ ...d, fill: props.colores[i % props.colores.length] }));

    const legendRef = useRef<HTMLDivElement>(null);
    const [legendFontSize, setLegendFontSize] = useState(15);

    const adjustFontSize = () => {
        const el = legendRef.current;
        if (!el || !el.clientHeight) return;
        let size = 15;
        el.style.fontSize = `${size}px`;
        while (el.scrollHeight > el.clientHeight && size > 8) {
            size -= 0.5;
            el.style.fontSize = `${size}px`;
        }
        setLegendFontSize(size);
    };

    useEffect(() => {
        adjustFontSize();
    }, [data]);

    useEffect(() => {
        const el = legendRef.current;
        if (!el) return;
        const ro = new ResizeObserver(adjustFontSize);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const total = data.reduce((acc, d) => acc + d.value, 0);

    const CustomLegend = (propsLegend: { datos: { name: string, value: number }[] }) => {
        return (
            <div className="diagrama-sectores-legend">
                {propsLegend.datos.map((dato, i) => (
                    <div key={dato.name} className="diagrama-sectores-legend-item">
                        <div className="diagrama-sectores-legend-punto" style={{ background: props.colores[i] }} />
                        <span className="diagrama-sectores-legend-nombre" style={{ color: props.colores[i] }}>{dato.name}</span>
                        <span className="diagrama-sectores-legend-valor">{dato.value.toLocaleString()}</span>
                        <span style={{ color: props.colores[i] }}>
                            {total > 0 ? ((dato.value / total) * 100).toFixed(1) : "0.0"}%
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
        //se sacan los datos que se le pasaron a este segmento del chart
        if (!active || !payload?.length) return null;
        const { name, value, fill } = payload[0].payload;
        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";

        //la estructura del tootltip
        return (
            <div className="diagrama-sectores-tooltip">
                <div className="diagrama-sectores-tooltip-titulo" style={{ color: fill }}>
                    {name}
                </div>
                <div className="diagrama-sectores-tooltip-cuerpo">
                    {value.toLocaleString()} envíos&nbsp;&nbsp;
                    <span style={{ color: fill }}>{pct}%</span>
                </div>
            </div>
        );
    };

    //se renderiza el diagrama con los datos y colores asignados
    return (
        <Skeleton loading={props.loading} className="diagrama-sectores-container @container w-full min-h-0 overflow-hidden">
            <div className="diagrama-sectores-cabecera">
                <p className="diagrama-sectores-titulo">{props.titulo}</p>
                {mostrarTotal && (
                    <>
                        <div className="diagrama-sectores-cabecera-separador" />
                        <span className="diagrama-sectores-total">
                            total: <span className="diagrama-sectores-total-valor">{total.toLocaleString()}</span>
                        </span>
                    </>
                )}
            </div>
            <div className="diagrama-sectores-chart flex-1 min-h-0 max-h-[60cqw] w-full">
                {/*Dentro de un ResponsiveContainer para evitar un bug que hay con el tooltip si no se pone*/}
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="50%"
                            outerRadius="80%"
                            paddingAngle={1.5}
                            isAnimationActive={true}
                            stroke="none"
                        />
                        <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div ref={legendRef} className="shrink-0 min-h-[30%] max-h-[40%] w-full overflow-hidden" style={{ fontSize: legendFontSize }}>
                <CustomLegend datos={data} />
            </div>
        </Skeleton>
    );
}
