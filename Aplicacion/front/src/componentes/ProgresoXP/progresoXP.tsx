import { useEffect, useState } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from "recharts";
import { socket } from "../../services/socket.ts";

const formatearXP = (xp: number): string => {
    if (xp >= 1_000_000) return `${+(xp / 1_000_000).toFixed(1)}M`;
    if (xp >= 1_000) return `${+(xp / 1_000).toFixed(1)}k`;
    return String(xp);
};

export default function ProgresoXP(props: {
    evento: string,
    datos: { mes: string, puntos: number }[],
}) {
    const [data, setData] = useState<{ mes: string, puntos: number }[]>(props.datos);

    useEffect(() => {
        setData(props.datos);
    }, [props.datos]);

    useEffect(() => {
        const handler = (nuevoDatos: { mes: string, puntos: number }[]) => {
            setData(nuevoDatos);
        };
        socket.on(props.evento, handler);
        return () => { socket.off(props.evento, handler); };
    }, [props.evento]);

    return (
        <div style={{
            width: "100%",
            height: "100%",
            containerType: "inline-size",
            background: "#D9EDF7",
            border: "1px solid #86e7ffa8",
            borderRadius: "10px",
            padding: "1rem",
            boxShadow: "0 0 10px #43555c66",
            display: "flex",
            flexDirection: "column",
        }}>
            <p style={{
                margin: 0,
                marginBottom: "0.5rem",
                fontWeight: 700,
                color: "#0c527a",
                fontSize: "0.95rem",
            }}>
                Progreso puntos de experiencia
            </p>
            <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#86e7ff55" />
                    <XAxis
                        dataKey="mes"
                        tick={{ fill: "#0c527a", fontSize: 11, fontWeight: 600 }}
                        axisLine={{ stroke: "#2675a6" }}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: "#0c527a", fontSize: 11, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                        tickFormatter={formatearXP}
                    />
                    <Tooltip
                        contentStyle={{
                            background: "#D9EDF7",
                            border: "1px solid #86e7ffa8",
                            borderRadius: "8px",
                            fontSize: "0.8rem",
                            color: "#0c527a",
                        }}
                        formatter={(value: number) => `${formatearXP(value)} pts`}
                    />
                    <Line
                        type="monotone"
                        dataKey="puntos"
                        stroke="#0c527a"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#2675a6", strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: "#0c527a" }}
                    />
                </LineChart>
            </ResponsiveContainer>
            </div>
        </div>
    );
}
