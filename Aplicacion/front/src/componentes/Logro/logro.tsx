import { socket } from "../../services/socket.ts";
import { useState, useEffect } from "react";

import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';

import { DatosLogro } from "shared";
import "./logro.css";


export default function Logro(props: {
    evento: string,
    dimensiones: { width: number; height: number, outerRadius: number },
    datos: DatosLogro,
    idx: number
}) {
    const imagen = "/logros/" + props.datos.imagen;
    const oculto = props.datos.sorpresa && !props.datos.obtenido;
    const sorpresaObtenido = props.datos.sorpresa && props.datos.obtenido;

    const [revelado, setRevelado] = useState(false);

    return (
        <>
            <Col key={props.idx}>
                <Card className='border-0'>
                    <Card.Img
                        variant="top"
                        src={imagen}
                        style={{
                            width: "65%",
                            margin: "0 auto",
                            padding: "2px",
                            display: "block",
                            filter: !props.datos.obtenido ? "grayscale(100%) brightness(50%)" : "none"
                        }} />
                    <Card.Body className={!props.datos.obtenido ? "text-center text-muted" : "text-center"}>
                        <Card.Title>{props.datos.nombre}</Card.Title>
                        <div className="logro-sorpresa-wrapper">
                            {sorpresaObtenido && !revelado && (
                                <div
                                    className="logro-sorpresa-mensaje"
                                    onClick={() => setRevelado(true)}
                                    style={{ cursor: "pointer" }}
                                >
                                    Haz click para ver la descripción
                                </div>
                            )}
                            <Card.Text
                                style={
                                    sorpresaObtenido && !revelado
                                        ? { filter: "blur(5px)", cursor: "pointer", userSelect: "none" }
                                        : oculto
                                            ? { filter: "blur(5px)", userSelect: "none" }
                                            : undefined
                                }
                                onClick={sorpresaObtenido && !revelado ? () => setRevelado(true) : undefined}
                            >
                                {oculto ? props.datos.descripcionBorrosa : props.datos.descripcion}
                            </Card.Text>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </>
    )

}