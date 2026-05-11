import { socket } from "../../services/socket.ts";
import { useState, useEffect } from "react";

import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';

import { DatosLogro } from "shared/LogroTypes";


export default function Logro(props: {
    evento: string,
    dimensiones: { width: number; height: number, outerRadius: number },
    datos: DatosLogro,
    idx: number
}) {
    const imagen = "/logros/" + props.datos.imagen;

    if (!props.datos.sorpresa || props.datos.obtenido) {
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
                        <Card.Body className="text-center">
                            <Card.Title>{props.datos.nombre}</Card.Title>
                            <Card.Text>
                                {props.datos.descripcion}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </>
        )
    } else {
        return (<></>)
    }

}