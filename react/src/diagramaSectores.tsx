import { PieChart, Pie } from "recharts";

export function EjemploRecharts(valores:{valor1: number; valor2: number; valor3: number}) {
    type DataItem = {
        name: string;
        value: number;
        fill?: string;
    };
    const data: DataItem[] = [
    { name: "Ventas", value: valores.valor1},
    { name: "Marketing", value: valores.valor2 },
    { name: "Soporte", value: valores.valor3 },
    ];
    const COLORS = ["#7947cfff", "#35d0bcff", "#df9350ff"]; 
    data.forEach((entry, index) => {
        entry.fill = COLORS[index % COLORS.length];
    });
    return (
        <PieChart width={300} height={300}>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label activeShape> </Pie>
        </PieChart>
    );
};