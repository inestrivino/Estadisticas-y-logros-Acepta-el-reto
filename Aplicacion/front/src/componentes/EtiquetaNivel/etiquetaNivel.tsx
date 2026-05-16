import { socket } from "../../services/socket.ts";
import { useState, useEffect } from "react";
import { NivelUsuario } from "shared/NivelUsuarios.ts"
import { colorDelNivel, colorTextoDelNivel } from "./colorDelNivel.ts";
import "./etiquetaNivel.css";

export default function EtiquetaNivel(props: {
    evento: string,
    nivel: NivelUsuario,
    loading?: boolean,
    className?: string,
}) {
    //el nivel base viene de las props, si llega una actualizacion por socket prevalece hasta nuevo cambio de props
    const [socketNivel, setSocketNivel] = useState<NivelUsuario | null>(null);

    useEffect(() => {
        const handler = (newNivel: NivelUsuario) => setSocketNivel(newNivel);
        socket.on(props.evento, handler);
        return () => { socket.off(props.evento, handler); };
    }, [props.evento]);

    useEffect(() => { setSocketNivel(null); }, [props.nivel]);

    const nivel = socketNivel ?? props.nivel;

    return (
        <span
            className={`etiqueta-nivel ms-2 ${props.className ?? ""}`}
            style={{ backgroundColor: colorDelNivel(nivel), color: colorTextoDelNivel(nivel) }}
        >
            {nivel}
        </span>
    );
}
