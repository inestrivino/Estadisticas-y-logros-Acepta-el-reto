import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, InputGroup } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

import { useAppContext } from "../../contexto/contextos";

import "./buscador.css";

function Buscador(props: {
    tipo: string,
    ruta: string,
    valorInicial?: string,
    prefijo?: React.ReactNode,
}) {
    const [elem, setElem] = useState(props.valorInicial ?? "");
    const [editando, setEditando] = useState(!props.prefijo);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const appContext = useAppContext();

    const buscar = () => {
        if (!elem.trim()) return;

        if (props.tipo === "problema_estadistica") {
            appContext?.setProblemaActual(elem);
            navigate(`/problemas/${elem}`);
        } else if (props.tipo === "usuario_estadistica") {
            appContext?.setUsuarioActual(elem);
            navigate(`/usuarios/estadisticas/${elem}`);
        } else if (props.tipo === "usuario_logro") {
            appContext?.setUsuarioActual(elem);
            navigate(`/usuarios/logros/${elem}`);
        }

        if (props.prefijo) setEditando(false);
    };

    const handleSearch = (e: any) => {
        e.preventDefault();
        buscar();
    };

    const activarEdicion = () => {
        setEditando(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    return (
        <Form onSubmit={handleSearch} className="buscador-app">
            <InputGroup className="buscador-app-group" onClick={!editando ? activarEdicion : undefined} style={{ cursor: !editando ? "text" : undefined }}>
                {props.prefijo && !editando ? (
                    <InputGroup.Text className="buscador-app-prefijo" style={{ flex: 1, borderRadius: "50px 0 0 50px" }}>
                        {props.prefijo}
                    </InputGroup.Text>
                ) : (
                    <Form.Control
                        ref={inputRef}
                        className="buscador-app-input"
                        type="text"
                        placeholder={editando ? "Buscar usuario..." : ""}
                        value={elem}
                        onChange={(e) => setElem(e.target.value)}
                        onBlur={() => { if (props.prefijo) setEditando(false); }}
                    />
                )}

                <Button
                    type="button"
                    className="buscador-app-button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editando ? buscar() : activarEdicion()}
                >
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                </Button>
            </InputGroup>
        </Form>
    );
}

export default Buscador;
