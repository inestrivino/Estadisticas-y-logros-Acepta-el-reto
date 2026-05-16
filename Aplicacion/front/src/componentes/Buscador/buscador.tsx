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
    onResultado?: (valor: string) => void,
}) {

    const [searchParams, setSearchParams] = useSearchParams();

    const [elem, setElem] = useState(props.valorInicial ?? "");
    const [editando, setEditando] = useState(!props.prefijo);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    //sincroniza editando con la presencia de prefijo (p.ej. cuando el padre actualiza usuario tras una busqueda)
    useEffect(() => {
        setEditando(!props.prefijo);
    }, [!!props.prefijo]);

    //sincroniza elem con valorInicial cuando cambia desde fuera
    useEffect(() => {
        if (props.valorInicial !== undefined) setElem(props.valorInicial);
    }, [props.valorInicial]);


    const [mensajeError, setMensajeError] = useState<string>("");

    // lista de hasta 5 usuarios que coinciden con lo que esta escrito en el buscador en el momento
    const [sugerencias, setSugerencias] = useState<string[]>([]);
    const [sugerenciaActiva, setSugerenciaActiva] = useState(-1);
    // guarda el area que ocupa el listado de sugerencias
    const sugerenciasRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!elem.trim()) {
            setSugerencias([]);
            return;
        }
        fetch(`/api/${props.tipo === "problema_estadistica" ? "problemas" : "usuarios"}?patron=${elem}`)
            .then(res => res.json())
            .then(data => {
                setSugerencias(data);
            });
    }, [elem]);

    useEffect(() => {
        const handleClickFueraDeSugerencias = (event: MouseEvent) => {
            if (
                sugerenciasRef.current &&
                !sugerenciasRef.current.contains(event.target as Node)
            ) {
                setSugerencias([]);
                setSugerenciaActiva(-1);
            }
        };

        document.addEventListener("mousedown", handleClickFueraDeSugerencias);

        return () => {
            document.removeEventListener("mousedown", handleClickFueraDeSugerencias);
        };
    }, []);

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
                        if (props.onResultado) {
                            props.onResultado(valor);
                        } else if (props.tipo === "usuario_estadistica") {
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

    const handleBusqueda = (e?: any, valorOverride?: string) => {
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
                handleBusqueda(undefined, seleccion);
            }
        }
    };

    const activarEdicion = () => {
        setEditando(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const grupoRef = useRef<HTMLDivElement>(null);
    const [anchoTitulo, setAnchoTitulo] = useState<number | undefined>(undefined);
    useEffect(() => { // guarda el ancho para que cuando busques tenga el mismo tamaño que cuando esta en modo titulo
        if (props.prefijo && !editando && grupoRef.current) {
            setAnchoTitulo(grupoRef.current.offsetWidth);
        }
    }, [editando, props.prefijo]);

    const [anchoSugerencias, setAnchoSugerencias] = useState<number | undefined>(undefined);
    useEffect(() => { // guarda el ancho del buscador para que el ancho del contenedor de sujerencias sea el mismo
        if (grupoRef.current) {
            setAnchoSugerencias(grupoRef.current.offsetWidth);
        }
    }, [editando, anchoTitulo]);

    return (
        <Form onSubmit={handleBusqueda} className="buscador-app">
            <div className="buscador-wrapper" ref={sugerenciasRef} style={{ position: "relative", width: "100%" }}>
                <InputGroup
                    ref={grupoRef}
                    className={`buscador-app-group flex-nowrap ${props.prefijo && !editando ? "modo-titulo" : ""}`}
                    onClick={!editando ? activarEdicion : undefined}
                    style={{
                        cursor: !editando ? "text" : undefined,
                        maxWidth: props.prefijo && editando && anchoTitulo ? `${anchoTitulo}px` : undefined
                    }}
                >

                    {props.prefijo && !editando ? (
                        <InputGroup.Text
                            className="buscador-app-prefijo d-flex align-items-center gap-2"
                            style={{ flex: 1, minWidth: 0, borderRadius: "50px 0 0 50px", fontSize: "clamp(1.5rem, 2vw, 2.25rem)" }}
                        >
                            {props.prefijo}
                        </InputGroup.Text>
                    ) : (
                        <Form.Control
                            ref={inputRef}
                            className="buscador-app-input flex-grow-1 min-w-0"
                            type="text"
                            placeholder={editando ? `Buscar ${props.tipo === "problema_estadistica" ? "problema" : "usuario"}...` : ""}
                            value={elem}
                            onChange={(e) => { setElem(e.target.value); setSugerenciaActiva(-1); }}
                            onKeyDown={handleKeyDown}
                            isInvalid={!!mensajeError}
                            onBlur={() => { if (props.prefijo) setEditando(false); }}
                        />
                    )}

                    <Button
                        type="button"
                        className="buscador-app-button flex-shrink-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editando ? buscar(elem) : activarEdicion()}
                    >
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </Button>
                </InputGroup>

                {sugerencias.length > 0 && editando && (
                    <ul className="buscador-sugerencias" style={{ width: anchoSugerencias ? `${anchoSugerencias}px` : "100%" }}>
                        {sugerencias.map((s, i) => (
                            <li key={i}
                                className={i === sugerenciaActiva ? "activa" : ""}
                                onMouseEnter={() => setSugerenciaActiva(i)}
                                onClick={() => {
                                    setElem(s);
                                    setSugerencias([]);
                                    handleBusqueda(undefined, s);
                                }}>
                                {s}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {mensajeError && (
                <div className="buscador-error">
                    {mensajeError}
                </div>
            )}
        </Form>
    );
}