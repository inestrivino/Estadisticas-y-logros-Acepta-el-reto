import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, InputGroup } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useSearchParams } from "react-router-dom";

import { useAppContext } from "../../contexto/contextos";

import "./buscador.css";

export default function Buscador(props: {
    tipo: string,
    ruta: string
}) {

    const [searchParams, setSearchParams] = useSearchParams();

    const [elem, setElem] = useState(""); //dependiendo de la vista representara el problema o el usuario
    const navigate = useNavigate();

    const appContext = useAppContext();

    const handleSearch = (e: any) => {
        e.preventDefault();

        if (!elem.trim())
            return;

        if (props.tipo === "problema_estadistica") {
            appContext?.setProblemaActual(elem);
            navigate(`/problemas/${elem}`);
            
        } else if (props.tipo === "usuario_estadistica") {
            appContext?.setUsuarioActual(elem);
            navigate(`/usuarios/estadisticas/${elem}`);

        } else if (props.tipo === "usuario_logro") {
            //TODO debug borrar
            //appContext?.setUsuarioActual("");

            appContext?.setUsuarioActual(elem);
            const clasificacionGuardada = searchParams.get("clasificacion")
                ?? localStorage.getItem("clasificacion")
                ?? "nivel";
            navigate(`/usuarios/logros/${elem}?clasificacion=${clasificacionGuardada}`);
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