import { socket } from "../services/socket.js";
import { PieChart, Pie, ResponsiveContainer, Tooltip } from "recharts";
import { useEffect, useState, useRef } from "react";

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
    datos: { name: string; value: number }[],
    colores: string[],
    dimensiones: { width: number; height: number, outerRadius: number },
}) {

    const [data, setData] = useState<DataItem[]>(() => {
        const inicial: DataItem[] = props.datos;
        for (let i = 0; i < inicial.length; i++) {
            inicial[i].fill = props.colores[i % props.colores.length];
        }
        return inicial;
    });

    useEffect(() => {
        const handler = (newDatos: DataItem[]) => {
            setData(() => {
                for (let i = 0; i < newDatos.length; i++) {
                    newDatos[i].fill = props.colores[i % props.colores.length];
                }
                return newDatos;
            });
        };

        socket.on(props.evento, handler);

        //se limpia el listener al desmontar el componente
        return () => {
            socket.off(props.evento, handler);
        };
    }, [props.evento]);

    const legendRef = useRef<HTMLDivElement>(null);
    const [legendFontSize, setLegendFontSize] = useState(15);

    useEffect(() => {
        const el = legendRef.current;
        if (!el) return;
        let size = 15;
        el.style.fontSize = `${size}px`;
        while (el.scrollHeight > el.clientHeight && size > 8) {
            size -= 0.5;
            el.style.fontSize = `${size}px`;
        }
        setLegendFontSize(size);
    }, [data]);

    const CustomLegend = (propsLegend: { datos: { name: string, value: number }[] }) => {
        let total = 0;
        for (const dato of propsLegend.datos)
            total += dato.value;
        return (
            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px 12px",
                justifyContent: "center",
                marginTop: 14,
            }}>
                {propsLegend.datos.map((dato, i) => (
                    <div key={dato.name} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        color: "#000000",
                        fontFamily: "monospace",
                    }}>
                        <div style={{
                            width: 8, height: 8,
                            borderRadius: "50%",
                            background: props.colores[i],
                            flexShrink: 0,
                        }} />
                        <span style={{ fontWeight: 550, color: props.colores[i] }}>{dato.name}</span>
                        <span style={{ color: "#4f4f4f" }}>{dato.value.toLocaleString()}</span>
                        <span style={{ color: props.colores[i] }}>
                            {((dato.value / total) * 100).toFixed(1)}%
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
        //se calcula el total porque eso no lo tiene el segmento del chart
        let total = 0;
        for (const dato of props.datos)
            total += dato.value;

        //se sacan los datos que se le pasaron a este segmento del chart
        if (!active || !payload?.length) return null;
        const { name, value, fill } = payload[0].payload;
        const pct = ((value / total) * 100).toFixed(1);

        //la estructura del tootltip 
        return (
            <div style={{
                background: "#D9EDF7",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                padding: "10px 14px",
                fontFamily: "monospace",
                fontSize: 12,
                color: "#e8eaf2",
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            }}>
                <div style={{ color: fill, fontWeight: 700, marginBottom: 4 }}>
                    {name}
                </div>
                <div style={{ color: "#a0a8c0" }}>
                    {value.toLocaleString()} envíos&nbsp;&nbsp;
                    <span style={{ color: fill }}>{pct}%</span>
                </div>
            </div>
        );
    };

    //se renderiza el diagrama con los datos y colores asignados
    return (
        <div className="@container w-full min-h-0 overflow-hidden" style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            alignItems: "center",
            minWidth: 0,
            background: "#D9EDF7",
            border: "1px solid #a6e1ff",
            borderRadius: "10px",
            boxShadow: "0 0 10px #43555c66",
        }}>
            <div className="flex-1 min-h-0 max-h-[60cqw] w-full">
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
        </div >
    );
}