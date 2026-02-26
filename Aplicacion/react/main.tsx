import { createRoot } from "react-dom/client";
import { PruebaSocket } from "./componentes/pruebaSocket.tsx";
import { Diagrama } from "./componentes/diagrama.tsx";
import { EventType } from "@/server/sockets/socketEventTypes.ts";
import { DatoNumerico } from "./componentes/datoNumerico.tsx";
import { response } from "express";
import { Sidebar } from "./componentes/Sidebar/sidebar.tsx";
import { Container, Row, Col } from "react-bootstrap";

const domNode = document.getElementById("diagramas");
if (domNode)
    renderPaginaDiagramas(domNode);

async function renderPaginaDiagramas(domNode: HTMLElement) {

    const envios = await fetch("/api/problemas/envios").then((response) => response.json());
    const tiempoMedio = await fetch("/api/problemas/tiempoMedio").then(response => response.json());
    const tiempoMin = await fetch("/api/problemas/tiempoMin").then(response => response.json());
    const problemas = await fetch("/api/problemas").then(response => response.json());

    const root = createRoot(domNode);
    root.render(
        <div className="d-flex">
            <Sidebar />

            <Container fluid="md" className="py-5 d-flex justify-content-center">
                <div style={{ width: "100%", maxWidth: "860px" }} className="mt-5">
                    <Row className="d-flex justify-content-between">
                    {/*<Row className="g-4">*/}

                        <Col xs="auto" >
                        {/*<Col xs={12} md="auto">*/}
                            <DatoNumerico
                                evento={EventType.ENVIOS_PROBLEMA}
                                dimensiones={{ width: 200, height: 100 }}
                                dato={envios}
                                style={{ gridArea: "dato1" }}
                            />
                        </Col>

                        <Col xs="auto" >
                        {/*<Col xs={12} md="auto">*/}
                            <DatoNumerico
                                evento={EventType.TIEMPO_MEDIO_PROBLEMA}
                                dimensiones={{ width: 200, height: 100 }}
                                dato={tiempoMedio}
                                style={{ gridArea: "dato2" }}
                            />
                        </Col>

                        <Col xs="auto" >
                        {/*<Col xs={12} md="auto">*/}
                            <DatoNumerico
                                evento={EventType.TIEMPO_MIN_PROBLEMA}
                                dimensiones={{ width: 200, height: 100 }}
                                dato={tiempoMin}
                                style={{ gridArea: "dato3" }}
                            />
                        </Col>
                    </Row>
                    <Row className="d-flex justify-content-between">
                    {/*<Row className="g-4">*/}
                        <Col xs="auto">
                        {/*<Col xs={12} lg={6} className="d-flex justify-content-center">*/}
                            <Diagrama
                                evento={EventType.DIAGRAMA_PROBLEMAS}
                                dimensiones={{ width: 370, height: 370, outerRadius: 75 }}
                                colores={[
                                    "#7947CF", "#35D0BC", "#DF9350", "#4F8EF7",
                                    "#E84C88", "#6BCF63", "#F2C94C", "#b351e0",
                                    "#EB5757", "#56CCF2", "#2F80ED",
                                ]}
                                datos={problemas}
                            />
                        </Col>

                        <Col xs="auto">
                        {/*<Col xs={12} lg={6} className="d-flex justify-content-center">*/}
                            <Diagrama
                                evento={EventType.DIAGRAMA_PROBLEMAS}
                                dimensiones={{ width: 370, height: 370, outerRadius: 75 }}
                                colores={[
                                    "#7947CF", "#35D0BC", "#DF9350", "#4F8EF7",
                                    "#E84C88", "#6BCF63", "#F2C94C", "#b351e0",
                                    "#EB5757", "#56CCF2", "#2F80ED",
                                ]}
                                datos={problemas}
                            />
                        </Col>

                    </Row>
                </div>
            </Container>
        </div >
    )
}

const domNode2 = document.getElementById("prueba-socket");
if (domNode2) {
    const root2 = createRoot(domNode2);
    root2.render(
        <>
            <PruebaSocket />
        </>
    );
}