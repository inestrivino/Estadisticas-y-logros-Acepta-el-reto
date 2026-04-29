import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, InputGroup } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useSearchParams } from "react-router-dom";

import "./buscador.css";

export default function Buscador(props: {
    tipo: string,
    ruta: string
}) {

    const [searchParams, setSearchParams] = useSearchParams();

    const [elem, setElem] = useState(""); //dependiendo de la vista representara el problema o el usuario
    const navigate = useNavigate();

    const [mensajeError, setMensajeError] = useState<string>("");

    const handleSearch = (e: any) => {
        e.preventDefault();

        if (!elem.trim())
            return;

        if (props.tipo === "problema_estadistica") {
            fetch(`/api/problemas/${elem}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.existe)
                        setMensajeError(`El problema "${elem}" no existe`);
                    else {
                        setMensajeError(``);
                        localStorage.setItem("problemaActual", elem);
                        navigate(`/problemas/${elem}`);
                    }
                });

        } else {

            fetch(`/api/usuarios/${elem}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.existe) {
                        setMensajeError(`El usuario "${elem}" no existe`);
                    } else {
                        setMensajeError("");
                        localStorage.setItem("usuarioActual", elem);
                        if (props.tipo === "usuario_estadistica") {
                            navigate(`/usuarios/estadisticas/${elem}`);

                        } else if (props.tipo === "usuario_logro") {
                            const clasificacionGuardada = searchParams.get("clasificacion")
                                ?? localStorage.getItem("clasificacion")
                                ?? "nivel";

                            navigate(`/usuarios/logros/${elem}?clasificacion=${clasificacionGuardada}`);
                        }
                    }
                });
        }

    };

    return (
        <Form onSubmit={handleSearch} className="buscador-app">
            <div className="buscador-wrapper">
                <InputGroup className="buscador-app-group">
                    <Form.Control
                        className="buscador-app-input"
                        type="text"
                        placeholder={`Buscar ${props.tipo}...`}
                        value={elem}
                        onChange={(e) => setElem(e.target.value)}
                        isInvalid={!!mensajeError}
                    />

                    <Button type="submit" className="buscador-app-button">
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </Button>
                </InputGroup>

                {mensajeError && (
                    <div className="buscador-error">
                        {mensajeError}
                    </div>
                )}
            </div>
        </Form>
    );
}