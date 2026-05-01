import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, InputGroup } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useSearchParams } from "react-router-dom";

import "./buscador.css";

export default function Buscador(props: {
    tipo: string,
    ruta: string,
    valorInicial?: string,
    prefijo?: React.ReactNode,
}) {

    const [searchParams, setSearchParams] = useSearchParams();

    const [elem, setElem] = useState(props.valorInicial ?? "");
    const [editando, setEditando] = useState(!props.prefijo);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();


    const [mensajeError, setMensajeError] = useState<string>("");

    const [sugerencias, setSugerencias] = useState<string[]>([]);
    const [sugerenciaActiva, setSugerenciaActiva] = useState(-1);
    useEffect(() => {
        if (!elem.trim()) {
            setSugerencias([]);
            return;
        }
        fetch(`/api/${props.tipo === "problema_estadistica" ? "problemas" : "usuarios"}?patron=${elem}`)
            .then(res => res.json())
            .then(data => {
                if (data.length === 1 && data[0] === elem)
                    setSugerencias([]);
                else
                    setSugerencias(data);
            });
    }, [elem]);

    const buscar = (valor: string) => {
        setSugerencias([]);
        setElem(String(valor).toLowerCase());

        if (!valor.trim())
            return;

        if (props.tipo === "problema_estadistica") {
            fetch(`/api/problemas/${valor}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.existe)
                        setMensajeError(`El problema "${valor}" no existe`);
                    else {
                        setMensajeError(``);
                        localStorage.setItem("problemaActual", valor);
                        navigate(`/problemas/${valor}`);
                    }
                });

        } else {

            fetch(`/api/usuarios/${valor}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.existe) {
                        setMensajeError(`El usuario "${valor}" no existe`);
                    } else {
                        setMensajeError("");
                        localStorage.setItem("usuarioActual", valor);
                        if (props.tipo === "usuario_estadistica") {
                            navigate(`/usuarios/estadisticas/${valor}`);

                        } else if (props.tipo === "usuario_logro") {
                            const clasificacionGuardada = searchParams.get("clasificacion")
                                ?? localStorage.getItem("clasificacion")
                                ?? "nivel";

                            navigate(`/usuarios/logros/${valor}?clasificacion=${clasificacionGuardada}`);
                        }
                    }
                });
        }
        if (props.prefijo) setEditando(false);
    }

    const handleSearch = (e?: any, valorOverride?: string) => {
        e?.preventDefault();
        const valor = valorOverride ?? elem;
        buscar(valor);
    };

    const handleKeyDown = (e: React.KeyboardEvent,) => {
        if (sugerencias.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSugerenciaActiva((prev) =>
                prev < sugerencias.length - 1 ? prev + 1 : 0
            );
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            setSugerenciaActiva((prev) =>
                prev > 0 ? prev - 1 : sugerencias.length - 1
            );
        }

        if (e.key === "Enter") {
            if (sugerenciaActiva >= 0) {
                e.preventDefault();
                const seleccion = sugerencias[sugerenciaActiva];
                setElem(seleccion);
                setSugerencias([]);
                handleSearch(undefined, seleccion);
            }
        }
    };

    const activarEdicion = () => {
        setEditando(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    return (
        <Form onSubmit={handleSearch} className="buscador-app">
            <div className="buscador-wrapper">
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
                            //placeholder={`Buscar ${props.tipo === "problema_estadistica" ? "problema" : "usuario"}...`}
                            value={elem}
                            onChange={(e) => { setElem(e.target.value); setSugerenciaActiva(-1); }}
                            onKeyDown={handleKeyDown}
                            isInvalid={!!mensajeError}
                            onBlur={() => { if (props.prefijo) setEditando(false); }}
                        />
                    )}

                    <Button
                        type="button"
                        className="buscador-app-button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editando ? buscar(elem) : activarEdicion()}
                    >
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </Button>
                </InputGroup>

                {sugerencias.length > 0 && (
                    <ul className="buscador-sugerencias">
                        {sugerencias.map((s, i) => (
                            <li key={i}
                                className={i === sugerenciaActiva ? "activa" : ""}
                                onMouseEnter={() => setSugerenciaActiva(i)}
                                onClick={() => {
                                    setElem(s);
                                    setSugerencias([]);
                                    handleSearch(undefined, s);
                                }}>
                                {s}
                            </li>
                        ))}
                    </ul>
                )}

                {mensajeError && (
                    <div className="buscador-error">
                        {mensajeError}
                    </div>
                )}
            </div>
        </Form>
    );
}