import { PieChart, Pie } from "recharts";
import { socket } from "./socket"; // Socket compartido
import { useState, useEffect } from 'react';

//contenido del diagrama
type DataItem = {
    name: string;
    value: number;
    fill?: string;
};

function formatearDatos(datos:{ name: string; value: number }[], colores:string[]){
    //se sacan los datos del array y se le asignan colores
    let info:DataItem[] = [];
    for (let i = 0; i < datos.length; i++) {
        const dato = datos[i];
        const color = colores[i % colores.length];
        info.push({ name: dato.name, value: dato.value, fill: color });
    }
    return info;
}

export function Diagrama(props: {
    evento: string,
    dimensiones: { width: number; height: number, outerRadius: number },
    colores: string[],
    datos: { name: string; value: number }[]
}) {
    
    //se le asignan los datos al diagrama
    const info = formatearDatos(props.datos, props.colores);
    const [data, setData] = useState<DataItem[]>(info);

    useEffect(() => {        
        socket.on(props.evento, (newDatos) => {
            console.log("Recibiendo datos nuevos:", newDatos);
            const info = formatearDatos(newDatos, props.colores);
            setData(info);
        });

        return () => {
            socket.off(props.evento);
        };
    }, []);

    return (
        <PieChart width={props.dimensiones.width} height={props.dimensiones.height}>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={props.dimensiones.outerRadius}/>
        </PieChart>
    );
}