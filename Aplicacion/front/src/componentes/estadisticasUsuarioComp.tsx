import { useEffect, useState } from "react";
import { EventType } from "shared/EventTypes.js";
import { formatEvent } from "shared/EventTypes.js";

//COMPONENTES
import PanelParticipacion from "./panelParticipacion.js";
import ProgresoXP from "./ProgresoXP/progresoXP.js";
import LogrosRecientes from "./LogrosRecientes/logrosRecientes.js";
import DiagramaSectores from "./diagramaSectores.js";
import DatoNumerico from "./datoNumerico.js";
import { DatosLogro } from "shared/LogroTypes.js";
import { NivelLogro, CategoriaLogro } from "shared/LogroConsts.js";

export default function EstadisticasUsuarioComp(props: {
    usuario: string
}) {

    const [usuario, setUsuario] = useState<string>("");
    useEffect(() => {
        setUsuario(props.usuario);
    }, [props.usuario]);

    //ENVIOS
    const [envios, setEnvios] = useState<{ timeStamp: number, value: number }[]>([]);
    useEffect(() => {
        fetch(`/api/usuarios/${usuario}/enviosAnio`)
            .then(response => response.json())
            .then(data => setEnvios(data));
    }, [usuario]);

    //PROGRESO XP
    const [progresoXP, setProgresoXP] = useState<{ mes: string, puntos: number }[]>([
        { mes: "Ene", puntos: 310 },
        { mes: "Feb", puntos: 400 },
        { mes: "Mar", puntos: 430 },
        { mes: "Abr", puntos: 520 },
        { mes: "May", puntos: 570 },
        { mes: "Jun", puntos: 100 },
        { mes: "Jul", puntos: 150 },
        { mes: "Ago", puntos: 100 },
        { mes: "Sep", puntos: 500 },
        { mes: "Oct", puntos: 600 },
        { mes: "Nov", puntos: 700 },
        { mes: "Dic", puntos: 800 },
    ]);
    useEffect(() => {
        if (!usuario) return;
        fetch(`/api/usuarios/${usuario}/progresoXP`)
            .then(response => response.json())
            .then(data => setProgresoXP(data));
    }, [usuario]);

    //RESULTADOS
    const [resultados, setResultados] = useState<{ name: string; value: number }[]>();
    useEffect(() => {
        fetch(`/api/usuarios/${usuario}/resultados`)
            .then(response => response.json())
            .then(data => setResultados(data));
    }, [usuario]);

    //LOGROS RECIENTES
    const [logrosRecientes, setLogrosRecientes] = useState<DatosLogro[]>([
        { nombre: "Primer logro", descripcion: "Descripción del primer logro", nivel: NivelLogro.ORO, imagen: "logro_placeholder.png", categoria: CategoriaLogro.CALIDAD, obtenido: true, sorpresa: true },
        { nombre: "Segundo logro", descripcion: "Descripción del segundo logro", nivel: NivelLogro.PLATA, imagen: "logro_placeholder.png", categoria: CategoriaLogro.CALIDAD, obtenido: true, sorpresa: false },
        { nombre: "Tercer logro", descripcion: "Descripción del tercer logro", nivel: NivelLogro.BRONCE, imagen: "logro_placeholder.png", categoria: CategoriaLogro.CALIDAD, obtenido: true, sorpresa: false },
    ]);
    useEffect(() => {
        if (!usuario) return;
        fetch(`/api/usuarios/${usuario}/logrosRecientes`)
            .then(response => response.json())
            .then(data => setLogrosRecientes(data));
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
            <div className="w-full lg:h-full lg:min-h-[450px]">
                <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-1 gap-4 lg:h-full">
                    {/* Columna izquierda - 2/3 del ancho */}
                    <div className="flex flex-col min-h-[600px] lg:col-span-2 w-full gap-4 lg:h-full lg:min-h-0">
                        {/* Fila de 4 métricas */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full shrink-0">
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

                        {/* Fila: Grafico de progreso XP + Logros */}
                        <div className="grid grid-cols-1 grid-rows-2 lg:grid-cols-3 lg:grid-rows-1 gap-4 w-full shrink-0 lg:flex-1 lg:min-h-0 min-h-[180px]">
                            {/* Progreso XP */}
                            <div className="lg:col-span-2 w-full h-full min-h-[250px] lg:min-h-0">
                                <ProgresoXP
                                    evento={formatEvent(String(usuario), EventType.USUARIO_PARTICIPACION)}
                                    datos={progresoXP}
                                />
                            </div>
                            {/* Panel de ultimos Logros */}
                            <div className="w-full h-full min-h-[250px] lg:min-h-0">
                                <LogrosRecientes
                                    evento={formatEvent(String(usuario), EventType.LOGROS_USUARIO_CATEGORIA)}
                                    usuario={String(usuario)}
                                    datos={logrosRecientes}
                                />
                            </div>
                        </div>

                        {/* Panel de envíos diarios */}
                        {envios.length !== 0 &&
                            <div className="shrink-0">
                                <PanelParticipacion
                                    evento={formatEvent(String(usuario), EventType.USUARIO_PARTICIPACION)}
                                    inicioSemana={new Date().getDay()}
                                    datos={envios}
                                    colores={["#0c527a", "#2675a6", "#60aade", "#90c4d1", "#ffffffc2"]}
                                />
                            </div>
                        }
                    </div>

                    {/* Columna derecha - 1/3 del ancho con los dos diagramas */}
                    <div className="flex flex-col gap-4 w-full min-h-[400px] lg:h-full lg:min-h-0">
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
