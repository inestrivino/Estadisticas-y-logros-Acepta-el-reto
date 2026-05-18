import { Link, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Container, Row, Col } from "react-bootstrap"
import { EventType, formatEvent } from "shared";
import "./estadisticasProblemaComp.css";

//COMPONENTES
import DatoNumerico from "../DatoNumerico/datoNumerico"
import DiagramaSectores from "../DiagramaSectores/diagramaSectores";

export default function EstadisticasProblemaComp(props: {
    problema: string
}) {

    const problema = props.problema;
    const problemaEncoded = encodeURIComponent(problema);

    //ENVIOS
    const [envios, setEnvios] = useState<number | null>(null);
    useEffect(() => {
        fetch(`/api/problemas/${problemaEncoded}/envios`)
            .then(response => response.json())
            .then(data => setEnvios(data));
    }, [problemaEncoded]);

    //MEJOR TIEMPO
    const [mejorTiempo, setMejorTiempo] = useState<number | null>(null);
    useEffect(() => {
        fetch(`/api/problemas/${problemaEncoded}/mejorTiempo`)
            .then(response => response.json())
            .then(data => setMejorTiempo(data));
    }, [problemaEncoded]);

    //TIEMPO PROMEDIO
    const [tiempoPromedio, setTiempoPromedio] = useState<number | null>(null);
    useEffect(() => {
        fetch(`/api/problemas/${problemaEncoded}/tiempoPromedio`)
            .then(response => response.json())
            .then(data => setTiempoPromedio(data));
    }, [problemaEncoded]);

    //RESULTADOS
    const [resultados, setResultados] = useState<{ name: string; value: number }[]>();
    useEffect(() => {
        fetch(`/api/problemas/${problemaEncoded}/resultados`)
            .then(response => response.json())
            .then(data => setResultados(data));
    }, [problemaEncoded]);

    //LENGUAJES
    const [lenguajes, setLenguajes] = useState<{ name: string; value: number }[]>();
    useEffect(() => {
        fetch(`/api/problemas/${problemaEncoded}/lenguajes`)
            .then(response => response.json())
            .then(data => setLenguajes(data));
    }, [problemaEncoded]);

    //carga unificada: el shimmer se mantiene en todos los paneles hasta que todos los fetch han terminado
    const loading = envios === null || mejorTiempo === null || tiempoPromedio === null
        || resultados === undefined || lenguajes === undefined;

    return (
        <div className="estadisticas-problema w-full flex flex-col gap-6 lg:h-full pb-4 lg:pb-0">

            {/* Fila de datos numéricos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">

                    <div className="flex justify-center">
                        <DatoNumerico
                            loading={loading}
                            evento={formatEvent(problema as string, EventType.ENVIOS_PROBLEMA)}
                            dimensiones={{ width: 200, height: 100 }}
                            dato={{ value: envios ?? 0, description: "Envios" }}
                        />
                    </div>

                    <div className="flex justify-center">
                        <DatoNumerico
                            loading={loading}
                            evento={formatEvent(problema as string, EventType.MEJOR_TIEMPO_PROBLEMA)}
                            dimensiones={{ width: 200, height: 100 }}
                            dato={{ value: mejorTiempo ?? 0, description: "Mejor tiempo" }}
                        />
                    </div>

                    <div className="flex justify-center">
                        <DatoNumerico
                            loading={loading}
                            evento={formatEvent(problema as string, EventType.TIEMPO_PROM_PROBLEMA)}
                            dimensiones={{ width: 200, height: 100 }}
                            dato={{ value: tiempoPromedio ?? 0, description: "Tiempo Promedio" }}
                        />
                    </div>
                </div>

            {/* Fila de diagramas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 lg:[grid-template-rows:1fr]">

                <div className="min-h-[350px] lg:min-h-[300px] lg:h-full flex flex-col">
                    <DiagramaSectores
                        loading={loading}
                        evento={formatEvent(problema as string, EventType.PROBLEMA_RESULTADOS)}
                        titulo="Resultados de envíos"
                        dimensiones={{ width: 350, height: 350, outerRadius: 75 }}
                        colores={[
                            "#7947CF", "#35D0BC", "#DF9350", "#4F8EF7",
                            "#E84C88", "#6BCF63", "#4c5df2", "#b351e0",
                            "#EB5757", "#56CCF2", "#2F80ED",
                        ]}
                        datos={resultados ?? []}
                    />
                </div>

                <div className="min-h-[350px] lg:min-h-[300px] lg:h-full flex flex-col">
                    <DiagramaSectores
                        loading={loading}
                        evento={formatEvent(problema as string, EventType.PROBLEMA_LENGUAJES)}
                        titulo="Lenguajes utilizados"
                        dimensiones={{ width: 350, height: 350, outerRadius: 75 }}
                        colores={[
                            "#7947CF", "#35D0BC", "#DF9350", "#4F8EF7",
                            "#E84C88", "#6BCF63", "#4c5df2", "#b351e0",
                            "#EB5757", "#56CCF2", "#2F80ED",
                        ]}
                        datos={lenguajes ?? []}
                    />
                </div>

            </div>
        </div>
    )
}
