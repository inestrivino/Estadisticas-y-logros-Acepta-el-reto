import { width } from "@fortawesome/free-solid-svg-icons/fa0"
import Card from "react-bootstrap/Card"
import Col from "react-bootstrap/Col"
import { Link } from "react-router-dom"

import "./plantillaTarjetaInformacion.css"

export default function PlantillaTarjetaInformacio(props: {
    titulo: string,
    icono?: React.ReactNode,
    contenido: React.ReactNode,
    tituloEnlace?: string,
    direccionEnlace?: string,
    enlaceExterno?: boolean
}) {

    return (
        <div className="xp-div" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Card
                style={{ flex: 1, background: "linear-gradient(160deg, #ffffff 0%, #f4f9fd 100%)" }}
                className="
                    !rounded-3xl
                    !border-2
                    !border-[#72ACD3]
                    overflow-hidden
                    h-full
                    tarjeta-info
                "
            >
                <Card.Title className="text-center mt-4 fw-bold text-xl">{props.titulo}</Card.Title>

                <div className="flex justify-content-center py-3">
                    {props.icono}
                </div>

                <Card.Body className="!pl-6 !pr-9 py-3" style={{ textAlign: "justify" }}>{props.contenido}</Card.Body>

                {props.direccionEnlace &&
                    <Card.Footer className="border-0 bg-transparent pt-0 text-center">
                        {props.enlaceExterno
                            ? <a
                                href={props.direccionEnlace}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-colors duration-150 hover:!text-[#72ACD3]"
                                style={{ color: "inherit" }}
                            >
                                {props.tituloEnlace}
                            </a>
                            : <Link to={props.direccionEnlace}
                                className="transition-colors duration-150 hover:!text-[#72ACD3]"
                                style={{ color: "inherit" }}
                            >
                                {props.tituloEnlace}
                            </Link>
                        }
                    </Card.Footer>
                }
            </Card>
        </div>
    )
}