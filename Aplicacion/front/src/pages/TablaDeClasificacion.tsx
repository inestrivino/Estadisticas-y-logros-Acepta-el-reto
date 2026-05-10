import Table from "react-bootstrap/Table";
import Pagination from "react-bootstrap/Pagination";
import Spinner from "react-bootstrap/Spinner";
import Form from 'react-bootstrap/Form';
import { useState, useEffect } from "react";
import { socket } from "../services/socket.ts";
import { EventType, formatEvent } from "shared";
import { useQueryState } from "../hooks/useQueryState.tsx";
import { Link, useSearchParams } from "react-router-dom";
import "./TablaDeClasificaion.css";
import { Badge } from "react-bootstrap";
import EtiquetaNivel from "../componentes/etiquetaNivel.tsx";
import { NivelUsuario } from "shared/NivelUsuarios.ts";

type datoUsuario = {
    nombre: string,
    nivel: string,
    xp: number,
    pos: number
};

type ActualizacionesRanking = {
    usuario: string,
    oldPos: number,
    newPos: number
}

type InfoActualizacionesRanking = {
    updates: ActualizacionesRanking[],
    minPos: number, //primera posicion del ranking afectada
    maxPos: number //ultima possicion del ranking afectada
}

export default function TablaDeClasificacion() {

    // usuarios que se van a mostrar en la tabla
    const [users, setUsers] = useState<datoUsuario[]>([]);

    // numero total de paginas de la tabla
    const [totalPags, setTotalPags] = useState(1);

    // si se estan cargando los datos en la tabla
    const [loading, setLoading] = useState(false);

    // obtiene el usuario de la query, en caso de no tenerlo lo obtendra de localStorage, si no no habra usuario y sera ""
    const [usuarioQuery, setUsuarioQuery] = useQueryState("usuarioActual", "");
    const usuario = usuarioQuery;
    const [usuarioExiste, setUsuarioExiste] = useState<boolean | null>(null);

    // obtiene el numero de pagina de la query, en caso de no tenerlo lo obtendra de localStora, si no el default value sera la 1
    const [pagStr, setPagStr] = useQueryState("pagina", "1");
    const pag = parseInt(pagStr);
    const setPag = (val: number) => setPagStr(String(val));

    // obtiene si se quiere filtrar los usuarios de la tabla por el nivel del usuario de la query, sino de localStorage, sino el
    //  valor sera false 
    const [porNivelStr, setPorNivelStr] = useQueryState("nivel", "false");
    const porNivel = porNivelStr === "true" && !!usuario;
    const setPorNivel = (val: boolean) => {
        setPorNivelStr(String(val));
    };

    // NIVEL
    const [nivel, setNivel] = useState<NivelUsuario>(NivelUsuario.SIN_NIVEL);
    useEffect(() => {
        if (usuarioExiste) {
            fetch(`/api/usuarios/${usuario}/nivel`)
                .then(response => response.json())
                .then(data => setNivel(data));
        }

    }, [usuario, usuarioExiste]);

    const [searchParams, setSearchParams] = useSearchParams();

    // se encarga de actualizar la url con los parametros necesarios (nivel, pagina, usuarioActual)
    useEffect(() => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);

            // si no hay usuario pone el filtrado de nivel a false
            const nivelFinal = usuario && usuarioExiste ? (prev.get("nivel") ?? porNivelStr) : "false";
            if (!prev.get("nivel") || !usuario) next.set("nivel", nivelFinal);

            //if (!prev.get("nivel")) next.set("nivel", usuario ? porNivelStr : "false");
            if (!prev.get("pagina")) next.set("pagina", pagStr);
            if (!prev.get("usuarioActual") && usuarioQuery) next.set("usuarioActual", usuarioQuery);
            return next;
        }, { replace: true });
    }, []);

    // cantidad de filas que tiene la tabla
    const pagSize = 10;

    // numero de filas / usuario de los que se hace peticion en cada pagina. Si hay un usuario buscado, la primera fila
    //  de la tabla pertenece a la informacion de este, y por tanto se necesitara la informacion de pagSize - 1 usuarios 
    //  para completar la tabla
    const [rows, setRows] = useState(pagSize);

    // se hace la peticion que devuelve la informacion de los usuario correspondiente a esa pagina, teniendo en cuenta el filtro por nivel
    const fetchRanking = async (pag: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/usuarios/ranking?pag=${pag}&tam=${rows}` + (porNivel ? `&usuario=${usuario}` : ""));
            const data = await res.json();

            setUsers(data.usuarios);
            setTotalPags(Math.ceil(data.totalUsuarios / rows));
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    // se actualiza la informacion de la tabla cada vez que se cambia de pagina o se cambia el filtro por nivel
    useEffect(() => {
        fetchRanking(pag);
    }, [pag, porNivel, rows]);

    // informacion del usuario buscado
    const [infoUsuario, setInfoUsuario] = useState<datoUsuario>();
    // Comprueba que el usuario de la url existe y en ese caso se actualiza la informacion cuando cambia el usuario o el filtro por nivel
    useEffect(() => {
        if (!usuario) {
            setUsuarioExiste(false);
            setInfoUsuario(undefined);
            setRows(pagSize);
            return;
        }

        fetch(`/api/usuarios/${usuario}`)
            .then(res => res.json())
            .then(data => {
                if (!data.existe) {
                    // si el usuario no existe, se limpiar todo
                    setUsuarioExiste(false);
                    setInfoUsuario(undefined);
                    setRows(pagSize);
                    setUsuarioQuery("");
                    setPorNivelStr("false");
                    localStorage.removeItem("usuarioActual");
                    localStorage.removeItem("nivel");
                    setSearchParams(prev => {
                        const next = new URLSearchParams(prev);
                        next.delete("usuarioActual");
                        next.set("nivel", "false");
                        return next;
                    }, { replace: true });
                } else {
                    // si el usuario existe, se obtiene su info en el ranking
                    setUsuarioExiste(true);
                    fetch(`/api/usuarios/ranking/${usuario}?filtrarNivel=${porNivel}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.pos === -1) {
                                setInfoUsuario(undefined);
                                setRows(pagSize);
                            } else {
                                setInfoUsuario(data);
                                setRows(pagSize - 1);
                            }
                        });
                }
            });
    }, [usuario, porNivel]); // porNivel porque la posición del usuario cambia con el filtro

    // maneja la actualizacion de la informacion de la tabla cuando se realizan nuevos envios
    useEffect(() => {
        socket.on(EventType.ACTUALIZACION_RANKING, () => {
            handleRankingUpdate(); // se actualiza la informacion de los usuarios
            // se actualiza la informacion del usuario
            if (usuario && usuarioExiste) {
                fetch(`/api/usuarios/ranking/${usuario}?filtrarNivel=${porNivel}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.pos !== -1)
                            setInfoUsuario(data);
                    });
            }
        });

        return () => {
            socket.off(EventType.ACTUALIZACION_RANKING);
        };
    }, [pag, porNivel, rows, usuario]);


    // se actualiza la informacion de latabla solo si alguno de los usuarios que se muestran actualmente ha sido afectado
    //  por los nuevos envios
    const handleRankingUpdate = async () => {
        fetchRanking(pag);
    }
    return (
        <div>
            <h1 className="p-4 text-3xl font-bold">
                Ranking usuarios ¡Acepta el reto!
            </h1>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                {usuarioExiste && <Form.Check
                    className="mb-2"
                    type="switch"
                    id="toggle-check"
                    dir="rtl"
                    label={
                        <span>
                            Filtrar por nivel
                            {nivel &&
                                <EtiquetaNivel
                                    evento={formatEvent(usuario, EventType.USUARIO_NIVEL)}
                                    nivel={nivel}
                                />
                            }
                        </span>
                    }
                    checked={porNivel}
                    onChange={(e) => {
                        // cuando se cambia el filtrado por nivel se actualizan las queries de la url y sus correspondiente valores en 
                        //  localStorage
                        if (!usuarioExiste) return;
                        const nuevoNivel = e.currentTarget.checked;
                        localStorage.setItem("nivel", String(nuevoNivel));
                        localStorage.setItem("pagina", "1");
                        setSearchParams(prev => {
                            const next = new URLSearchParams(prev);
                            next.set("nivel", String(nuevoNivel));
                            next.set("pagina", "1");
                            return next;
                        }, { replace: true });
                    }}
                />}
                {loading ? (
                    <Spinner animation="border" />
                ) : (
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Usuario</th>
                                <th>Nivel</th>
                                <th>XP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {infoUsuario &&
                                <tr key={1} className="table-dark">
                                    <td>{infoUsuario.pos}</td>
                                    <td>
                                        <Link to={`/usuarios/estadisticas/${infoUsuario.nombre}`} className="usuario-link">
                                            {infoUsuario.nombre}
                                        </Link>
                                    </td>
                                    <td>{infoUsuario.nivel}</td>
                                    <td>{infoUsuario.xp}</td>
                                </tr>}
                            {users.map((u: datoUsuario, index) => (
                                <tr key={u.nombre} className={u.nombre === usuario ? "table-dark" : ""}>
                                    <td>{u.pos}</td>
                                    <td>
                                        <Link to={`/usuarios/estadisticas/${u.nombre}`} className="usuario-link">
                                            {u.nombre}
                                        </Link>
                                    </td>
                                    <td>{u.nivel}</td>
                                    <td>{u.xp}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}

                <div className="aligne-items-center">
                    <Pagination>
                        <Pagination.Prev onClick={() => setPag(pag - 1)} disabled={pag === 1} />
                        {pag !== 1 && <Pagination.Ellipsis />}
                        {/*TODO descomentar esto y borrar la linea anterior */}
                        {/*{pag > 3 && <Pagination.Ellipsis />}
                        {pag > 2 && <Pagination.Item>{pag - 2}</Pagination.Item>}
                        {pag > 1 && <Pagination.Item>{pag - 1}</Pagination.Item>}*/}

                        <Pagination.Item key={pag} active={true} onClick={() => setPag(pag)}>
                            {pag}
                        </Pagination.Item>

                        {/*TODO descomentar esto y borrar la linea posterior */}
                        {/*{pag < totalPags - 1 && <Pagination.Item>{pag + 1}</Pagination.Item>}
                        {pag < totalPags - 2 && <Pagination.Item>{pag + 2}</Pagination.Item>}
                        {pag < totalPags - 3 && <Pagination.Ellipsis />}*/}
                        {pag !== totalPags && <Pagination.Ellipsis />}
                        <Pagination.Next onClick={() => setPag(pag + 1)} disabled={pag === totalPags} />
                    </Pagination>
                </div>

            </div>
        </div>
    );
}
