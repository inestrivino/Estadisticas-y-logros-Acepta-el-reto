import { socket } from "../services/socket.ts";
import { useState, useEffect } from "react";
import { NivelUsuario } from "shared/NivelUsuarios.ts"

export default function EtiquetaNivel(props: {
    evento: string,
    nivel: NivelUsuario,
    loading?: boolean,
    className?: string,
}) {
    //se colocan los datos con un useState para actualizarlos si llega un mensaje por el socket
    const [nivel, setNivel] = useState<NivelUsuario>(props.nivel);

    //sincroniza el estado cuando el dato inicial llega desde el padre (tras el fetch)
    useEffect(() => {
        if (props.loading) return;
        setNivel(props.nivel);
    }, [props.nivel, props.loading]);

    //se actualiza el dato cada vez que llega un nuevo mensaje por el socket
    useEffect(() => {
        const handler = (newNivel: NivelUsuario) => {
            setNivel(newNivel);
        };

        socket.on(props.evento, handler);

        //se limpia el listener al desmontar el componente
        return () => {
            socket.off(props.evento, handler);
        };
    }, [props.evento]);

    const colorDelNivel = (n: NivelUsuario) => {
        switch (n) {
            case NivelUsuario.APRENDIZ: return "#3c6e71";
            case NivelUsuario.COMPETENTE: return "#80AEAB";
            case NivelUsuario.ESPECIALISTA: return "#7A99C7";
            case NivelUsuario.HABIL: return "#0078A7";
            case NivelUsuario.MAESTRO: return "#848F95";
        }
    }

    return (
        <span className={`ms-2 ${props.className ?? ""}`} style={{
            backgroundColor: colorDelNivel(nivel),
            color: "#fff",
            padding: "0.3em 1em",
            borderRadius: "999px",
            fontSize: "0.7em",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            lineHeight: 1,
            marginTop: "0.20em",
        }}>
            {nivel}
        </span>
    );
}