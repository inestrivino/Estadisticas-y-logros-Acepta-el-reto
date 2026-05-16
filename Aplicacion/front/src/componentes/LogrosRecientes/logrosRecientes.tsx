import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { socket } from "../../services/socket.ts";
import { DatosLogro } from "shared/LogroTypes.js";
import { NivelLogro } from "shared/LogroConsts.js";
import Skeleton from "../Skeleton/skeleton.tsx";

const NIVEL_COLOR: Record<string, string> = {
    [NivelLogro.ORO]: "#f9c22b",
    [NivelLogro.PLATA]: "#9babb2",
    [NivelLogro.BRONCE]: "#cd683d",
};

export default function LogrosRecientes(props: {
    evento: string,
    usuario: string,
    datos: DatosLogro[],
    loading?: boolean,
}) {
    //el dato base viene de las props, si llega una actualizacion por socket prevalece hasta nuevo cambio de props
    const [socketData, setSocketData] = useState<DatosLogro[] | null>(null);

    useEffect(() => {
        const handler = (nuevos: DatosLogro[]) => setSocketData(nuevos);
        socket.on(props.evento, handler);
        return () => { socket.off(props.evento, handler); };
    }, [props.evento]);

    useEffect(() => { setSocketData(null); }, [props.datos]);

    const recientes = socketData ?? props.datos;

    return (
        <Skeleton loading={props.loading} style={{
            width: "100%",
            height: "100%",
            background: "#D9EDF7",
            border: "1px solid #86e7ffa8",
            borderRadius: "10px",
            padding: "1rem",
            boxShadow: "0 0 10px #43555c66",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
        }}>
            <p style={{
                margin: 0,
                fontWeight: 700,
                color: "#0c527a",
                fontSize: "0.95rem",
                textAlign: "center",
            }}>
                Últimos logros
            </p>

            <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateRows: `repeat(${recientes.length || 1}, minmax(0, 1fr))`, gap: "0.4rem" }}>
                {recientes.length === 0 && (
                    <p style={{
                        color: "#2675a6",
                        fontSize: "0.85rem",
                        margin: "auto 0",
                        textAlign: "center",
                        fontStyle: "italic",
                    }}>
                        Aún no tienes ningún logro. ¡Sigue participando!
                    </p>
                )}
                {recientes.map((logro, i) => (
                    <div key={i} style={{
                        position: "relative",
                        height: "100%",
                        boxSizing: "border-box",
                        overflow: "hidden",
                        minHeight: 0,
                        background: "#ffffffa0",
                        borderRadius: "8px",
                        padding: "0.3rem 0.5rem",
                        borderLeft: `4px solid ${NIVEL_COLOR[logro.nivel] ?? "#2675a6"}`,
                    }}>
                        <img style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", maxHeight: "100%", width: "auto" }}
                            src={`/logros/${logro.imagen}`}
                            alt={logro.nombre}
                        />
                    </div>
                ))}
            </div>

            <Link
                to={`/usuarios/logros/${props.usuario}`}
                style={{
                    display: "block",
                    textAlign: "center",
                    marginTop: "auto",
                    padding: "0.3rem 0",
                    background: "#2675a6",
                    color: "#fff",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                }}
            >
                Ver todos
            </Link>
        </Skeleton>
    );
}
