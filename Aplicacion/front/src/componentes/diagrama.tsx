import { PieChart, Pie, Legend } from "recharts";
import { socket } from "../services/socket.ts"; // Socket compartido
import { useState, useEffect, useMemo } from 'react';

//contenido del diagrama
type DataItem = {
    name: string;
    value: number;
    fill?: string;
};

export default function Diagrama(props: {
    evento: string,
    dimensiones: { width: number; height: number, outerRadius: number },
    colores: string[],
    datos: { name: string; value: number }[]
}) {
    //se colocan los datos con un useState para actualizarlos si llega un mensaje por el socket
    const [data, setData] = useState<DataItem[]>(() => {
        console.log("Inicializando datos del diagrama");
        console.log(props.datos);
        const inicial: DataItem[] = props.datos;
        for (let i = 0; i < inicial.length; i++) {
            inicial[i].fill = props.colores[i % props.colores.length];
        }
        return inicial;
    });

    //se actualiza el diagrama cada vez que llega un nuevo mensaje por el socket
    useEffect(() => {
        socket.on(props.evento, (newDato: string) => {
            setData(prevData => {
                let newData: DataItem[] = [];
                for (let i = 0; i < prevData.length; i++) {
                    if (prevData[i].name === newDato) {
                        newData[i] = {
                            name: prevData[i].name,
                            value: prevData[i].value + 1,
                            fill: prevData[i].fill
                        }
                    }
                    else
                        newData[i] = prevData[i];
                }
                return newData
            });
        });

        //se limpia el listener al desmontar el componente
        return () => {
            socket.off(props.evento);
        };
    }, []);

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