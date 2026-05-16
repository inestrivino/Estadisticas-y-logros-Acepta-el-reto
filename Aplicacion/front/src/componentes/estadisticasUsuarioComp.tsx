import { useEffect, useState } from "react";
import { EventType } from "shared/EventTypes.js";
import { formatEvent } from "shared/EventTypes.js";
import { useParams } from "react-router-dom";

//COMPONENTES
import PanelParticipacion from "./panelParticipacion.js";
import ProgresoXP from "./ProgresoXP/progresoXP.js";
import LogrosRecientes from "./LogrosRecientes/logrosRecientes.js";
import DiagramaSectores from "./diagramaSectores.js";
import DatoNumerico from "./datoNumerico.js";
import { DatosLogro } from "shared/LogroTypes.js";
import DatoNumericoRanking from "./datoNumericoRanking.js";

export default function EstadisticasUsuarioComp(props: {
    usuario: string
}) {

    const usuario = props.usuario;

    //ENVIOS
    const [envios, setEnvios] = useState<{ timeStamp: number, value: number }[]>([]);
    useEffect(() => {
        if (!usuario) return;
        fetch(`/api/usuarios/${usuario}/enviosAnio`)
            .then(response => response.json())
            .then(data => setEnvios(data));
    }, [usuario]);

    //PROGRESO XP
    const [progresoXP, setProgresoXP] = useState<{ mes: string, puntos: number }[]>([]);
    useEffect(() => {
        if (!usuario) return;
        fetch(`/api/usuarios/${usuario}/xpPorMes`)
            .then(response => response.json())
            .then(data => setProgresoXP(data));
    }, [usuario]);

    //RESULTADOS
    const [resultados, setResultados] = useState<{ name: string; value: number }[]>();
    useEffect(() => {
        if(!usuario) return;
        fetch(`/api/usuarios/${usuario}/resultados`)
            .then(response => response.json())
            .then(data => setResultados(data));
    }, [usuario]);

    //LOGROS RECIENTES
    const [logrosRecientes, setLogrosRecientes] = useState<DatosLogro[]>([]);
    useEffect(() => {
        if (!usuario) return;
        fetch(`/api/usuarios/${usuario}/logrosRecientes`)
            .then(response => response.json())
            .then(data => setLogrosRecientes(data));
    }, [usuario]);

    //LENGUAJES
    const [lenguajes, setLenguajes] = useState<{ name: string; value: number }[]>();
    useEffect(() => {
        if (!usuario) return;
        fetch(`/api/usuarios/${usuario}/lenguajes`)
            .then(response => response.json())
            .then(data => setLenguajes(data));
    }, [usuario]);


    const [posRanking, setPosRanking] = useState<number | null>(null);
    const [ejerciciosResueltos, setEjerciciosResueltos] = useState<number | null>(null);
    const [rachaActualEnvios, setRachaActualEnvios] = useState<number | null>(null);
    const [rachaMaxEnvios, setRachaMaxEnvios] = useState<number | null>(null);
    useEffect(() => {
        if (!usuario) return;

        async function fetchData() {
            const [
                posRankingData,
                ejerciciosResueltosData,
                rachaActualEnviosData,
                rachaMaxEnviosData
            ] = await Promise.all([
                fetch(`/api/usuarios/${usuario}/posRanking`).then(r => r.json()),
                fetch(`/api/usuarios/${usuario}/numEjerciciosResueltos`).then(r => r.json()),
                fetch(`/api/usuarios/${usuario}/rachaActualEnvios`).then(r => r.json()),
                fetch(`/api/usuarios/${usuario}/rachaMaxEnvios`).then(r => r.json()),
            ]);

            setPosRanking(posRankingData);
            setEjerciciosResueltos(ejerciciosResueltosData);
            setRachaActualEnvios(rachaActualEnviosData);
            setRachaMaxEnvios(rachaMaxEnviosData);

            console.log(posRankingData);
            console.log(ejerciciosResueltosData);
            console.log(rachaActualEnviosData);
            console.log(rachaMaxEnviosData);
        }

        fetchData();
    }, [usuario]);

    return (
        <>
            <div className="w-full lg:h-full pb-4 lg:pb-0 lg:min-h-150">
                <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-1 gap-4 lg:h-full">
                    {/* Columna izquierda - 2/3 del ancho */}
                    <div className="flex flex-col lg:col-span-2 w-full gap-4 lg:h-full lg:min-h-0">
                        {/* Fila de 4 métricas */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full shrink-0">
                            <DatoNumericoRanking
                                loading={posRanking === null}
                                usuario={usuario}
                                dimensiones={{ width: 200, height: 100 }}
                                dato={{ value: posRanking ?? 0, description: "Tabla de clasificación" }}
                            />
                            <DatoNumerico
                                loading={ejerciciosResueltos === null}
                                evento={formatEvent(String(usuario), EventType.USUARIO_NUM_PROBLEMAS_RESUELTOS)}
                                dimensiones={{ width: 200, height: 100 }}
                                dato={{ value: ejerciciosResueltos ?? 0, description: "Ejercicios resueltos" }}
                            />
                            <DatoNumerico
                                loading={rachaActualEnvios === null}
                                evento={formatEvent(String(usuario), EventType.USUARIO_RACHA_ACTUAL_ENVIOS_AC)}
                                dimensiones={{ width: 200, height: 100 }}
                                dato={{ value: rachaActualEnvios ?? 0, description: "Racha actual envios" }}
                            />
                            <DatoNumerico
                                loading={rachaMaxEnvios === null}
                                evento={formatEvent(String(usuario), EventType.USUARIO_RACHA_MAX_ENVIOS_AC)}
                                dimensiones={{ width: 200, height: 100 }}
                                dato={{ value: rachaMaxEnvios ?? 0, description: "Racha máxima envios" }}
                            />
                        </div>

                        {/* Fila: Grafico de progreso XP + Logros */}
                        <div className="grid grid-cols-1 grid-rows-2 lg:grid-cols-3 lg:grid-rows-1 gap-4 w-full shrink-0 lg:flex-1 lg:min-h-0 min-h-[180px]">
                            {/* Progreso XP */}
                            <div className="lg:col-span-2 w-full h-full min-h-[250px] lg:min-h-0">
                                <ProgresoXP
                                    evento={formatEvent(String(usuario), EventType.USUARIO_EXPERIENCIA_MES)}
                                    datos={progresoXP}
                                />
                            </div>
                            {/* Panel de ultimos Logros */}
                            <div className="w-full h-full min-h-[250px] lg:min-h-0">
                                <LogrosRecientes
                                    evento={formatEvent(String(usuario), EventType.LOGROS_RECIENTES_USUARIO)}
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
                                    datos={envios}
                                    colores={["#0c527a", "#2675a6", "#60aade", "rgb(151, 214, 255)", "#ffffffc2"]}
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
