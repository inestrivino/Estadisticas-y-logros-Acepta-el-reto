import { PieChart, Pie, Legend } from "recharts";
import useSocket from "../hooks/socket.ts";

//contenido del diagrama
type DataItem = {
    name: string;
    value: number;
    fill?: string;
};

export default function Diagrama(props: {
    evento: string,
    datos: { name: string; value: number }[],
    colores: string[],
    dimensiones: { width: number; height: number, outerRadius: number },
}) {

    const data = useSocket(props.evento, props.datos, props.colores);

    //se renderiza el diagrama con los datos y colores asignados
    return (
        <div style={{ //caja que rodea al diagrama
            //border: "1px solid #ccc",
            borderRadius: "12px",
            padding: "16px",
            margin: "5px",
            display: "inline-block",
            textAlign: "center",
            width: `${props.dimensiones.width * 1.1}px`,
            height: `${props.dimensiones.height * 1.1}px`,
            backgroundColor: "#D9EDF7"
        }}>
            <PieChart width={props.dimensiones.width} height={props.dimensiones.height}>
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={30}
                    outerRadius={props.dimensiones.outerRadius}
                    paddingAngle={2}
                    label
                    isAnimationActive={false}
                />
                <Legend />
            </PieChart>
        </div>
    );
}