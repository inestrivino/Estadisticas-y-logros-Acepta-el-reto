import { Link, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Container, Row, Col } from "react-bootstrap"
import { EventType, formatProblemEvent } from "shared";

//COMPONENTES
import Sidebar from "../componentes/Sidebar/sidebar.tsx"
import { DatoNumerico } from "../componentes/datoNumerico.tsx"
import Diagrama from "../componentes/diagrama.tsx"

export default function EstadisticasProblema() {

    //parametros de la url
    const { problema } = useParams();

    //ENVIOS
    const [envios, setEnvios] = useState<number>(0);
    useEffect(() => {
        fetch(`/api/problemas/${problema}/envios`)
            .then(response => response.json())
            .then(data => setEnvios(data));
    }, [problema]);

    //MEJOR TIEMPO
    const [mejorTiempo, setMejorTiempo] = useState<number>(0);
    useEffect(() => {
        fetch(`/api/problemas/${problema}/mejorTiempo`)
            .then(response => response.json())
            .then(data => setMejorTiempo(data));
    }, [problema]);

    //TIEMPO PROMEDIO
    const [tiempoPromedio, setTiempoPromedio] = useState<number>(0);
    useEffect(() => {
        fetch(`/api/problemas/${problema}/tiempoPromedio`)
            .then(response => response.json())
            .then(data => setTiempoPromedio(data));
    }, [problema]);

    //RESULTADOS
    const [resultados, setResultados] = useState<{ name: string; value: number }[]>();
    useEffect(() => {
        fetch(`/api/problemas/${problema}/resultados`)
            .then(response => response.json())
            .then(data => setResultados(data));
    }, [problema]);

    //LENGUAJES
    const [lenguajes, setLenguajes] = useState<{ name: string; value: number }[]>();
    useEffect(() => {
        fetch(`/api/problemas/${problema}/lenguajes`)
            .then(response => response.json())
            .then(data => setLenguajes(data));
    }, [problema]);

    return (
        <div className="d-flex">
            <Sidebar />

            <Container fluid="md" className="py-5 d-flex justify-content-center">
                <div style={{ width: "100%", maxWidth: "860px" }} className="mt-5">
                    <Row className="d-flex justify-content-between">
                        {/*<Row className="g-4">*/}
                        <Col xs="auto" >
                            {/*<Col xs={12} md="auto">*/}
                            {envios && <DatoNumerico
                                evento={formatProblemEvent(problema as string, EventType.ENVIOS_PROBLEMA)}
                                dimensiones={{ width: 200, height: 100 }}
                                dato={{ value: envios, description: "Envios" }}
                                style={{ gridArea: "dato1" }}
                            />}
                        </Col>

                        <Col xs="auto" >
                            {/*<Col xs={12} md="auto">*/}
                            {mejorTiempo && <DatoNumerico
                                evento={formatProblemEvent(problema as string, EventType.MEJOR_TIEMPO_PROBLEMA)}
                                dimensiones={{ width: 200, height: 100 }}
                                dato={{ value: mejorTiempo, description: "Mejor tiempo" }}
                                style={{ gridArea: "dato2" }}
                            />}
                        </Col>

                        <Col xs="auto" >
                            {/*<Col xs={12} md="auto">*/}
                            {tiempoPromedio && <DatoNumerico
                                evento={formatProblemEvent(problema as string, EventType.TIEMPO_PROM_PROBLEMA)}
                                dimensiones={{ width: 200, height: 100 }}
                                dato={{ value: tiempoPromedio, description: "Tiempo Promedio" }}
                                style={{ gridArea: "dato3" }}
                            />}
                        </Col>
                    </Row>
                    <Row className="d-flex justify-content-between">
                        {/*<Row className="g-4">*/}
                        <Col xs="auto">
                            {/*<Col xs={12} lg={6} className="d-flex justify-content-center">*/}
                            {resultados && <Diagrama
                                evento={formatProblemEvent(problema as string, EventType.DIAGRAMA_PROBLEMAS)}
                                dimensiones={{ width: 370, height: 370, outerRadius: 75 }}
                                colores={[
                                    "#7947CF", "#35D0BC", "#DF9350", "#4F8EF7",
                                    "#E84C88", "#6BCF63", "#F2C94C", "#b351e0",
                                    "#EB5757", "#56CCF2", "#2F80ED",
                                ]}
                                datos={resultados as { name: string; value: number }[]}
                            />}
                        </Col>
                        <Col xs="auto">
                            {/*<Col xs={12} lg={6} className="d-flex justify-content-center">*/}
                            {lenguajes && <Diagrama
                                evento={formatProblemEvent(problema as string, EventType.DIAGRAMA_LENGUAJES)}
                                dimensiones={{ width: 370, height: 370, outerRadius: 75 }}
                                colores={[
                                    "#7947CF", "#35D0BC", "#DF9350", "#4F8EF7",
                                    "#E84C88", "#6BCF63", "#F2C94C", "#b351e0",
                                    "#EB5757", "#56CCF2", "#2F80ED",
                                ]}
                                datos={lenguajes as { name: string; value: number }[]}
                            />}
                        </Col>
                    </Row>
                    <Link to="/PruebaSocket">Get</Link>
                </div>
            </Container>
        </div >
    )
}
