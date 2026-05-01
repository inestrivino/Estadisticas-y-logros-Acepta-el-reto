import { Link, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Container, Row, Col } from "react-bootstrap"
import { EventType, formatEvent } from "shared";
import "./estadisticasProblemaComp.css";

//COMPONENTES
import DatoNumerico from "../datoNumerico"
import DiagramaSectores from "../diagramaSectores";

export default function EstadisticasProblemaComp(props: {
    problema: string
}) {

    const problema = props.problema;

    //ENVIOS
    const [envios, setEnvios] = useState<number | null>(null);
    useEffect(() => {
        fetch(`/api/problemas/${problema}/envios`)
            .then(response => response.json())
            .then(data => setEnvios(data));
    }, [problema]);

    //MEJOR TIEMPO
    const [mejorTiempo, setMejorTiempo] = useState<number | null>(null);
    useEffect(() => {
        fetch(`/api/problemas/${problema}/mejorTiempo`)
            .then(response => response.json())
            .then(data => setMejorTiempo(data));
    }, [problema]);

    //TIEMPO PROMEDIO
    const [tiempoPromedio, setTiempoPromedio] = useState<number | null>(null);
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
        <div className="w-full mt-4 pb-4 flex flex-col gap-6 lg:h-full">

            {/* Fila de datos numéricos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">

                <div className="flex justify-center">
                    <DatoNumerico
                        loading={envios === null}
                        evento={formatEvent(problema as string, EventType.ENVIOS_PROBLEMA)}
                        dimensiones={{ width: 200, height: 100 }}
                        dato={{ value: envios ?? 0, description: "Envios" }}
                    />
                </div>

                <div className="flex justify-center">
                    <DatoNumerico
                        loading={mejorTiempo === null}
                        evento={formatEvent(problema as string, EventType.MEJOR_TIEMPO_PROBLEMA)}
                        dimensiones={{ width: 200, height: 100 }}
                        dato={{ value: mejorTiempo ?? 0, description: "Mejor tiempo" }}
                    />
                </div>

                <div className="flex justify-center">
                    <DatoNumerico
                        loading={tiempoPromedio === null}
                        evento={formatEvent(problema as string, EventType.TIEMPO_PROM_PROBLEMA)}
                        dimensiones={{ width: 200, height: 100 }}
                        dato={{ value: tiempoPromedio ?? 0, description: "Tiempo Promedio" }}
                    />
                </div>
            </div>

            {/* Fila de diagramas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 lg:[grid-template-rows:1fr]">

                <div className="min-h-[350px] lg:min-h-[300px] lg:h-full flex flex-col">
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
                </div>

                <div className="min-h-[350px] lg:min-h-[300px] lg:h-full flex flex-col">
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
        </div>
    )
}
