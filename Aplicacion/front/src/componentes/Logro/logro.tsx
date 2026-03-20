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

    return (
        <>
            <Col key={props.idx}>
                <Card className='border-0'>
                    <Card.Img variant="top" src={imagen} style={{ filter: !props.datos.obtenido ? 'grayscale(100%)' : 'none' }} />
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
}