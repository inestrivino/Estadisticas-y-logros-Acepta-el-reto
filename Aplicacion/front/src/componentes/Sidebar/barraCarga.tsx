import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHourglass } from "@fortawesome/free-solid-svg-icons";
import { socket } from "../../services/socket.ts";

interface Props {
    evento: string;
    progresoInicial?: number;
}

export default function BarraCarga({ evento, progresoInicial }: Props) {

    //progreso de carga, se inicializa con el valor persistido en redis
    const [progreso, setProgreso] = useState(0);

    //estado para mostrar el tooltip al pasar el raton
    const [hover, setHover] = useState(false);

    //sincroniza cuando llega el valor inicial desde el fetch del padre
    useEffect(() => {
        if (progresoInicial !== undefined)
            setProgreso(progresoInicial);
    }, [progresoInicial]);

    //actualiza el progreso cuando llega un nuevo valor por socket
    useEffect(() => {
        const handler = (valor: number) => {
            setProgreso(valor);
        };

        socket.on(evento, handler);

        return () => {
            socket.off(evento, handler);
        };
    }, [evento]);

    //no muestra la barra si ya termino de cargar
    if (progreso as number >= 100) return null;

    return (
        <div
            className="pt-3"
            style={{ position: "relative" }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <div className="barra-carga">
                <div className="barra-carga-fill" style={{ width: `${progreso}%` }} />
                <span className="barra-carga-texto" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <FontAwesomeIcon icon={faHourglass} />Cargando envíos
                </span>
            </div>
            {hover && (
                <div className="barra-carga-tooltip">
                    La aplicación está cargando<br />los datos de Acepta el reto<br />{progreso}% completado
                </div>
            )}
        </div>
    );
}
