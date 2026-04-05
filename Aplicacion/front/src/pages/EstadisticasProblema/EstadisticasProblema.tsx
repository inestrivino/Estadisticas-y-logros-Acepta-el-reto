import { Link, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Container, Row, Col } from "react-bootstrap"
import { EventType, formatEvent } from "shared";
import "./EstadisticasProblema.css";

//COMPONENTES
import DatoNumerico from "../../componentes/datoNumerico"
import DiagramaSectores from "../../componentes/diagramaSectores";

export default function EstadisticasProblema() {

    //parametros de la url
    const { problema } = useParams();

    //ENVIOS
    const [envios, setEnvios] = useState<number>(0);
    useEffect(() => {
        fetch(`/api/problemas/${problema}/envios`)
            .then(response => response.json())
            .then(data => setEnvios(data));
    }, [problema]);

    //MEJOR TIEMPO
    const [mejorTiempo, setMejorTiempo] = useState<number>(0);
    useEffect(() => {
        fetch(`/api/problemas/${problema}/mejorTiempo`)
            .then(response => response.json())
            .then(data => setMejorTiempo(data));
    }, [problema]);

    //TIEMPO PROMEDIO
    const [tiempoPromedio, setTiempoPromedio] = useState<number>(0);
    useEffect(() => {
        fetch(`/api/problemas/${problema}/tiempoPromedio`)
            .then(response => response.json())
            .then(data => setTiempoPromedio(data));
    }, [problema]);

    //RESULTADOS
    const [resultados, setResultados] = useState<{ name: string; value: number }[]>();
    useEffect(() => {
        fetch(`/api/problemas/${problema}/resultados`)
            .then(response => response.json())
            .then(data => setResultados(data));
    }, [problema]);

    //LENGUAJES
    const [lenguajes, setLenguajes] = useState<{ name: string; value: number }[]>();
    useEffect(() => {
        fetch(`/api/problemas/${problema}/lenguajes`)
            .then(response => response.json())
            .then(data => setLenguajes(data));
    }, [problema]);

    return (
        <>
            <h1 className="p-4 text-3xl font-bold">
                Estadísticas problema <span className="font-bold">{problema}</span>
            </h1>

            {/* Contenedor principal */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">

                {/* Fila de datos numéricos - responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">

                    {envios && (
                        <div className="flex justify-center">
                            <DatoNumerico
                                evento={formatEvent(problema as string, EventType.ENVIOS_PROBLEMA)}
                                dimensiones={{ width: 200, height: 100 }}
                                dato={{ value: envios, description: "Envios" }}
                            />
                        </div>
                    )}

                    {mejorTiempo && (
                        <div className="flex justify-center">
                            <DatoNumerico
                                evento={formatEvent(problema as string, EventType.MEJOR_TIEMPO_PROBLEMA)}
                                dimensiones={{ width: 200, height: 100 }}
                                dato={{ value: mejorTiempo, description: "Mejor tiempo" }}
                            />
                        </div>
                    )}

                    {tiempoPromedio && (
                        <div className="flex justify-center">
                            <DatoNumerico
                                evento={formatEvent(problema as string, EventType.TIEMPO_PROM_PROBLEMA)}
                                dimensiones={{ width: 200, height: 100 }}
                                dato={{ value: tiempoPromedio, description: "Tiempo Promedio" }}
                            />
                        </div>
                    )}
                </div>

                {/* Fila de diagramas - responsive */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-">

                    {resultados && (
                        <DiagramaSectores
                            evento={formatEvent(problema as string, EventType.PROBLEMA_RESULTADOS)}
                            dimensiones={{ width: 350, height: 350, outerRadius: 75 }}
                            colores={[
                                "#7947CF", "#35D0BC", "#DF9350", "#4F8EF7",
                                "#E84C88", "#6BCF63", "#4c5df2", "#b351e0",
                                "#EB5757", "#56CCF2", "#2F80ED",
                            ]}
                            datos={resultados as { name: string; value: number }[]}
                        />
                    )}

                    {lenguajes && (
                        <DiagramaSectores
                            evento={formatEvent(problema as string, EventType.PROBLEMA_LENGUAJES)}
                            dimensiones={{ width: 350, height: 350, outerRadius: 75 }}
                            colores={[
                                "#7947CF", "#35D0BC", "#DF9350", "#4F8EF7",
                                "#E84C88", "#6BCF63", "#4c5df2", "#b351e0",
                                "#EB5757", "#56CCF2", "#2F80ED",
                            ]}
                            datos={lenguajes as { name: string; value: number }[]}
                        />
                    )}

                </div>
            </div>
        </>
    )
}
