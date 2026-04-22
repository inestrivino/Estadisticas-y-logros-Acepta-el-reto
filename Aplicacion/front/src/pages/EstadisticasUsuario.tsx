import { useEffect, useState } from "react";
import { EventType } from "shared/EventTypes.ts";
import { formatEvent } from "shared/EventTypes.ts";
import { useParams } from "react-router-dom";

//COMPONENTES
import PanelParticipacion from "../componentes/panelParticipacion.js";

import DiagramaSectores from "../componentes/diagramaSectores.tsx";
import DatoNumerico from "../componentes/datoNumerico.tsx";

export default function EstadisticasUsuario() {

    //parametros de la url
    const { usuario } = useParams();

    //ENVIOS
    const [envios, setEnvios] = useState<{ timeStamp: number, value: number }[]>([]);
    useEffect(() => {
        fetch(`/api/usuarios/${usuario}/enviosAnio`)
            .then(response => response.json())
            .then(data => setEnvios(data));
    }, [usuario]);

    //RESULTADOS
    const [resultados, setResultados] = useState<{ name: string; value: number }[]>();
    useEffect(() => {
        fetch(`/api/usuarios/${usuario}/resultados`)
            .then(response => response.json())
            .then(data => setResultados(data));
    }, [usuario]);

    //LENGUAJES
    const [lenguajes, setLenguajes] = useState<{ name: string; value: number }[]>();
    useEffect(() => {
        fetch(`/api/usuarios/${usuario}/lenguajes`)
            .then(response => response.json())
            .then(data => setLenguajes(data));
    }, [usuario]);

    return (
        <>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
                    {/* Columna izquierda - 2/3 del ancho */}
                    <div className="lg:col-span-2 w-full flex flex-col gap-4 justify-around">
                        {/* Fila de 4 métricas */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                            <DatoNumerico
                                evento={formatEvent(String(usuario), EventType.TIEMPO_PROM_PROBLEMA)}
                                dimensiones={{ width: 200, height: 100 }}
                                dato={{ value: 10, description: "Tiempo Promedio" }}
                            />
                            <DatoNumerico
                                evento={formatEvent(String(usuario), EventType.TIEMPO_PROM_PROBLEMA)}
                                dimensiones={{ width: 200, height: 100 }}
                                dato={{ value: 10, description: "Tiempo Promedio" }}
                            />
                            <DatoNumerico
                                evento={formatEvent(String(usuario), EventType.TIEMPO_PROM_PROBLEMA)}
                                dimensiones={{ width: 200, height: 100 }}
                                dato={{ value: 10, description: "Tiempo Promedio" }}
                            />
                            <DatoNumerico
                                evento={formatEvent(String(usuario), EventType.TIEMPO_PROM_PROBLEMA)}
                                dimensiones={{ width: 200, height: 100 }}
                                dato={{ value: 10, description: "Tiempo Promedio" }}
                            />
                        </div>

                        {/* Fila: Gráfico de progreso + Logros */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
                            <div className="lg:col-span-2 w-full">
                                {envios.length !== 0 && <PanelParticipacion
                                    evento={formatEvent(String(usuario), EventType.TIEMPO_PROM_PROBLEMA)}
                                    inicioSemana={new Date().getDay()}
                                    datos={envios}
                                    colores={["#0c527a", "#2675a6", "#60aade", "#90c4d1", "#ffffffc2"]}
                                />}
                            </div>
                            <div className="w-full">
                                <DatoNumerico
                                    evento={formatEvent(String(usuario), EventType.TIEMPO_PROM_PROBLEMA)}
                                    dimensiones={{ width: 200, height: 100 }}
                                    dato={{ value: 10, description: "Tiempo Promedio" }}
                                />
                            </div>
                        </div>

                        {/* Panel de envíos diarios */}
                        {envios.length !== 0 && <PanelParticipacion
                            evento={formatEvent(String(usuario), EventType.USUARIO_PARTICIPACION)}
                            inicioSemana={new Date().getDay()}
                            datos={envios}
                            colores={["#0c527a", "#2675a6", "#60aade", "#90c4d1", "#ffffffc2"]}
                        />}
                    </div>

                    {/* Columna derecha - 1/3 del ancho con los dos diagramas */}
                    <div className="flex flex-col gap-4 w-full">
                        {resultados && (
                            <DiagramaSectores
                                evento={formatEvent(usuario as string, EventType.USUARIO_RESULTADOS)}
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
                                evento={formatEvent(usuario as string, EventType.USUARIO_LENGUAJES)}
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
        </>
    );
}