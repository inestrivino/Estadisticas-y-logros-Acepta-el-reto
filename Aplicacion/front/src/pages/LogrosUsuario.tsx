import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { EventType, formatProblemEvent } from "shared";
import { Container, Row, Col, Card } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightLeft } from "@fortawesome/free-solid-svg-icons";
import {Tab, Tabs} from 'react-bootstrap';

// COMPONENTES
import GrupoLogro from "../componentes/Logro/grupoLogros";
import { ListadoLogros } from "shared/LogroTypes";
import { CategoriaLogro, NivelLogro } from "shared/LogroConsts";


export default function LogrosUsuario() {

    const { usuario } = useParams();

    const [logros, setLogros] = useState<ListadoLogros>();
    useEffect(() => { //TODO al inicializar la vista de logros ver si recordamos de la ultima vez visitada o no
        fetch(`/api/usuarios/${usuario}/logros?clasificacion=nivel`)
            .then(response => response.json())
            .then(data => {
                setLogros(data);
                //console.log(JSON.stringify(data, null, 2));
            });
    }, [usuario])

    const [key, setKey] = useState('nivel');

    return (
        <>
            <h1 className="p-4 titulo">Logros de <b>{usuario}</b></h1>
            <Container fluid="md" className="d-flex justify-content-center">
                <div style={{ width: "100%", maxWidth: "1100px" }} className="mt-2">
                    {logros?.grupos.map((logrosGrupo, idx) => (
                        <GrupoLogro
                            dimensiones={{ width: 1100, height: 300, outerRadius: 0 }}
                            color={getGroupColor(logrosGrupo.grupo)}
                            datos={logrosGrupo}
                        />
                    ))}
                </div>
            </Container >
        </>
    )

    function getGroupColor(grupo: string) {
        let color = "black"
        switch (grupo) {
            case NivelLogro.ORO: color = "#f9c22b"; break;
            case NivelLogro.PLATA: color = "#9babb2"; break;
            case NivelLogro.BRONCE: color = "#Cd683d"; break;
            case CategoriaLogro.ONBOARDING: color = "red"; break;
            case CategoriaLogro.CALIDAD: color = "lightblue"; break;
            case CategoriaLogro.CATEGORIAS: color = "blue"; break;
            case CategoriaLogro.LENGUAJES: color = "lightgreen"; break;
            case CategoriaLogro.PROBLEMAS: color = "green"; break;
            case CategoriaLogro.RACHAS: color = "purple"; break;
        }
        return color;
    }
}