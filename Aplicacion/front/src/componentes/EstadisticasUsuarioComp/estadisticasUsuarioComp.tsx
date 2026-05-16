import { useEffect, useState } from "react";
import { EventType } from "shared/EventTypes.js";
import { formatEvent } from "shared/EventTypes.js";

//COMPONENTES
import PanelParticipacion from "../PanelParticipacion/panelParticipacion.js";
import ProgresoXP from "../ProgresoXP/progresoXP.js";
import LogrosRecientes from "../LogrosRecientes/logrosRecientes.js";
import DiagramaSectores from "../DiagramaSectores/diagramaSectores.js";
import DatoNumerico from "../DatoNumerico/datoNumerico.js";
import DatoNumericoDoble from "../DatoNumerico/datoNumericoDoble.js";
import DatoNumericoRanking from "../DatoNumerico/datoNumericoRanking.js";
import { DatosLogro } from "shared/LogroTypes.js";
import "./estadisticasUsuarioComp.css";

const COLORES_SECTORES = [
    "#7947CF", "#35D0BC", "#DF9350", "#4F8EF7",
    "#E84C88", "#6BCF63", "#4c5df2", "#b351e0",
    "#EB5757", "#56CCF2", "#2F80ED",
];

const COLORES_PARTICIPACION = ["#0c527a", "#2675a6", "#60aade", "rgb(151, 214, 255)", "#ffffffc2"];

export default function EstadisticasUsuarioComp(props: {
    usuario: string
}) {

    const usuario = props.usuario;

    //ENVIOS
    const [envios, setEnvios] = useState<{ timeStamp: number, value: number }[] | null>(null);
    useEffect(() => {
        if (!usuario) return;
        fetch(`/api/usuarios/${usuario}/enviosAnio`)
            .then(response => response.json())
            .then(data => setEnvios(data));
    }, [usuario]);

    //PROGRESO XP
    const [progresoXP, setProgresoXP] = useState<{ mes: string, puntos: number }[] | null>(null);
    useEffect(() => {
        if (!usuario) return;
        fetch(`/api/usuarios/${usuario}/xpPorMes`)
            .then(response => response.json())
            .then(data => setProgresoXP(data));
    }, [usuario]);

    //RESULTADOS
    const [resultados, setResultados] = useState<{ name: string; value: number }[] | null>(null);
    useEffect(() => {
        if(!usuario) return;
        fetch(`/api/usuarios/${usuario}/resultados`)
            .then(response => response.json())
            .then(data => setResultados(data));
    }, [usuario]);

    //LOGROS RECIENTES
    const [logrosRecientes, setLogrosRecientes] = useState<DatosLogro[] | null>(null);
    useEffect(() => {
        if (!usuario) return;
        fetch(`/api/usuarios/${usuario}/logrosRecientes`)
            .then(response => response.json())
            .then(data => setLogrosRecientes(data));
    }, [usuario]);

    //LENGUAJES
    const [lenguajes, setLenguajes] = useState<{ name: string; value: number }[] | null>(null);
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
    const [rachaActualDias, setRachaActualDias] = useState<number | null>(null);
    const [rachaMaxDias, setRachaMaxDias] = useState<number | null>(null);
    useEffect(() => {
        if (!usuario) return;

        async function fetchData() {
            const [
                posRankingData,
                ejerciciosResueltosData,
                rachaActualEnviosData,
                rachaMaxEnviosData,
                rachaActualDiasData,
                rachaMaxDiasData
            ] = await Promise.all([
                fetch(`/api/usuarios/${usuario}/posRanking`).then(r => r.json()),
                fetch(`/api/usuarios/${usuario}/numEjerciciosResueltos`).then(r => r.json()),
                fetch(`/api/usuarios/${usuario}/rachaActualEnvios`).then(r => r.json()),
                fetch(`/api/usuarios/${usuario}/rachaMaxEnvios`).then(r => r.json()),
                fetch(`/api/usuarios/${usuario}/rachaActualDias`).then(r => r.json()),
                fetch(`/api/usuarios/${usuario}/rachaMaxDias`).then(r => r.json()),
            ]);

            setPosRanking(posRankingData);
            setEjerciciosResueltos(ejerciciosResueltosData);
            setRachaActualEnvios(rachaActualEnviosData);
            setRachaMaxEnvios(rachaMaxEnviosData);
            setRachaActualDias(rachaActualDiasData);
            setRachaMaxDias(rachaMaxDiasData);
        }

        fetchData();
    }, [usuario]);

    //carga unificada: el shimmer se mantiene en todos los paneles hasta que todos los fetch han terminado
    const loading = envios === null || progresoXP === null || resultados === null
        || logrosRecientes === null || lenguajes === null || posRanking === null
        || ejerciciosResueltos === null || rachaActualEnvios === null || rachaMaxEnvios === null
        || rachaActualDias === null || rachaMaxDias === null;

    return (
        <div className="estadisticas-usuario-wrapper">
            <div className="estadisticas-usuario-grid">
                {/* Columna izquierda - 2/3 del ancho */}
                <div className="estadisticas-usuario-columna-izquierda">
                    {/* Fila de 4 metricas */}
                    <div className="estadisticas-usuario-metricas">
                        <DatoNumericoRanking
                            loading={loading}
                            usuario={usuario}
                            dimensiones={{ width: 200, height: 100 }}
                            dato={{ value: posRanking ?? 0, description: "Tabla de clasificación" }}
                        />
                        <DatoNumerico
                            loading={loading}
                            evento={formatEvent(String(usuario), EventType.USUARIO_NUM_PROBLEMAS_RESUELTOS)}
                            dimensiones={{ width: 200, height: 100 }}
                            dato={{ value: ejerciciosResueltos ?? 0, description: "Ejercicios resueltos" }}
                        />
                        <DatoNumericoDoble
                            loading={loading}
                            dimensiones={{ width: 200, height: 100 }}
                            titulo="Racha envíos aceptados"
                            izquierda={{
                                evento: formatEvent(String(usuario), EventType.USUARIO_RACHA_ACTUAL_ENVIOS_AC),
                                value: rachaActualEnvios ?? 0,
                                label: "actual",
                            }}
                            derecha={{
                                evento: formatEvent(String(usuario), EventType.USUARIO_RACHA_MAX_ENVIOS_AC),
                                value: rachaMaxEnvios ?? 0,
                                label: "máxima",
                            }}
                        />
                        <DatoNumericoDoble
                            loading={loading}
                            dimensiones={{ width: 200, height: 100 }}
                            titulo="Racha de días"
                            izquierda={{
                                evento: formatEvent(String(usuario), EventType.USUARIO_RACHA_ACTUAL_DIAS),
                                value: rachaActualDias ?? 0,
                                label: "actual",
                            }}
                            derecha={{
                                evento: formatEvent(String(usuario), EventType.USUARIO_RACHA_MAX_DIAS),
                                value: rachaMaxDias ?? 0,
                                label: "máxima",
                            }}
                        />
                    </div>

                    {/* Fila: Grafico de progreso XP + Logros */}
                    <div className="estadisticas-usuario-fila-grafica">
                        {/* Progreso XP */}
                        <div className="estadisticas-usuario-xp-wrapper">
                            <ProgresoXP
                                loading={loading}
                                evento={formatEvent(String(usuario), EventType.USUARIO_EXPERIENCIA_MES)}
                                datos={progresoXP ?? []}
                            />
                        </div>
                        {/* Panel de ultimos logros */}
                        <div className="estadisticas-usuario-logros-wrapper">
                            <LogrosRecientes
                                loading={loading}
                                evento={formatEvent(String(usuario), EventType.LOGROS_RECIENTES_USUARIO)}
                                usuario={String(usuario)}
                                datos={logrosRecientes ?? []}
                            />
                        </div>
                    </div>

                    {/* Panel de envios diarios */}
                    <div className="estadisticas-usuario-panel-envios">
                        <PanelParticipacion
                            loading={loading}
                            evento={formatEvent(String(usuario), EventType.USUARIO_PARTICIPACION)}
                            datos={envios ?? []}
                            colores={COLORES_PARTICIPACION}
                        />
                    </div>
                </div>

                {/* Columna derecha - 1/3 del ancho con los dos diagramas */}
                <div className="estadisticas-usuario-columna-derecha">
                    <DiagramaSectores
                        loading={loading}
                        evento={formatEvent(usuario as string, EventType.USUARIO_RESULTADOS)}
                        titulo="Resultados de envíos"
                        mostrarTotal={true}
                        dimensiones={{ width: 350, height: 350, outerRadius: 75 }}
                        colores={COLORES_SECTORES}
                        datos={resultados ?? []}
                    />

                    <DiagramaSectores
                        loading={loading}
                        evento={formatEvent(usuario as string, EventType.USUARIO_LENGUAJES)}
                        titulo="Lenguajes utilizados"
                        mostrarTotal={true}
                        dimensiones={{ width: 350, height: 350, outerRadius: 75 }}
                        colores={COLORES_SECTORES}
                        datos={lenguajes ?? []}
                    />
                </div>
            </div>
        </div>
    );
}
