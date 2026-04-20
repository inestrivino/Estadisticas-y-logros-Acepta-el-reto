import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, InputGroup } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

import { AppContecxtType, useAppContext } from "../contexto/contextos";

import "./buscador.css";

function Buscador(props: {
    tipo: string /* o problemas o usuarios*/
}) {
    const [elem, setElem] = useState(""); //dependiendo de la vista representara el problema o el usuario
    const navigate = useNavigate();

    const appContext = useAppContext();

    const handleSearch = (e: any) => {
        e.preventDefault();

        if (!elem.trim()) 
            return;

        if(props.tipo === "problema") {
            appContext?.setProblemaActual(elem);
            navigate(`/problemas/${elem}`);
        } else {
            appContext?.setUsuarioActual(elem);
            navigate(`/usuarios/estadisticas/${elem}`);
        }
        
    };

    return (
        <Form onSubmit={handleSearch} className="buscador-app">
            <InputGroup className="buscador-app-group">
                <Form.Control
                    className="buscador-app-input"
                    type="text"
                    placeholder={`Buscar ${props.tipo}...`}
                    value={elem}
                    onChange={(e) => setElem(e.target.value)}
                />

                <Button type="submit" className="buscador-app-button">
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                </Button>
            </InputGroup>
        </Form>
    );
}

export default Buscador;