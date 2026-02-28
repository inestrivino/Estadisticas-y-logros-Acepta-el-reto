import { socket } from "../services/socket.ts"; // Socket compartido
import { useState, useEffect } from 'react';

type DataItem = {
    name: string;
    value: number;
    fill?: string;
};

export default function useSocket(evento: string, initialData: DataItem[], colores: string[]) {
    //carga inicial
    const [data, setData] = useState<DataItem[]>(() => {
        const inicial: DataItem[] = initialData;
        for (let i = 0; i < inicial.length; i++) {
            inicial[i].fill = colores[i % colores.length];
        }
        return inicial;
    });

    //carga cada vez que llega un nuevo mensaje por el socket
    useEffect(() => {
        const handler = (newDato: string) => {
            setData(prevData => {
                let newData:DataItem[] = [];
                let encontrado:boolean = false;
                for (let i = 0; i < prevData.length; i++) {
                    if (prevData[i].name === newDato) {
                        newData[i] = {
                            name: prevData[i].name,
                            value: prevData[i].value + 1,
                            fill: prevData[i].fill
                        }
                        encontrado = true;
                    }
                    else
                        newData[i] = prevData[i];
                }
                if (!encontrado) {
                    newData.push({
                        name: newDato,
                        value: 1,
                        fill: colores[newData.length % colores.length]
                    });
                }
                return newData;
            });
        };

        socket.on(evento, handler);

        return () => {
            socket.off(evento, handler);
        };

    }, []);

    return data;
}