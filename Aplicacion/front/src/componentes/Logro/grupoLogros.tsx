import { Row } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { EventType, formatEvent } from "shared";
import { TGrupoLogros } from "shared/LogroTypes";

// COMPONENTES
import Logro from "./logro";

export default function GrupoLogros(props: {
    dimensiones: { width: number; height: number, outerRadius: number },
    color: string,
    datos: TGrupoLogros,
}) {

    const { usuario } = useParams();

    return (
        <div style={{ width: "100%", maxWidth: "1100px", border: "3px solid " + props.color, borderRadius: "7px" }}
            className="mb-3">
            <h3 className="p-2 d-inline-block" style={{ backgroundColor: props.color, borderRadius: "1px" }}>{props.datos.grupo}</h3>
            <Row xs={2} md={4} className="g-4 justify-content-center">
                {props.datos.logros.map((logro, idx) => (
                    <Logro
                        key={idx}
                        evento={formatEvent(usuario as string, EventType.LOGROS_USUARIO_CATEGORIA)}
                        dimensiones={{ width: 350, height: 350, outerRadius: 75 }}
                        datos={logro}
                        idx={idx}
                    />
                ))}
            </Row>
        </div>
    )
}