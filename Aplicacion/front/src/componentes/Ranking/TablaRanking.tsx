import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Spinner from "react-bootstrap/Spinner";
import { Link } from "react-router-dom";
import { EventType, formatEvent } from "shared";
import { NivelUsuario } from "shared";
import { datoUsuario } from "./utils.ts";
import EtiquetaNivel from "../EtiquetaNivel/etiquetaNivel.tsx";

/**
 * Tabla del ranking con el listado de usuarios.
 * Cada nombre abre un popover con accesos a sus estadisticas, sus logros y
 * la opcion de marcarlo como usuario destacado del ranking. Solo hay un popover
 * activo a la vez: abrir uno nuevo reemplaza al anterior.
 * @param props.users - Listado de usuarios a renderizar en la pagina actual.
 * @param props.loading - Indica si los datos se estan cargando, para mostrar un spinner.
 * @param props.usuarioDestacado - Nombre del usuario actualmente destacado (vacio si ninguno).
 * @param props.onMarcarUsuario - Callback al pulsar "Marcar en el ranking" en el popover.
 */
export default function TablaRanking(props: {
    users: datoUsuario[],
    loading: boolean,
    usuarioDestacado: string,
    onMarcarUsuario: (nombre: string) => void,
}) {
    
    //se sacan los parametros del props
    const { users, loading, usuarioDestacado, onMarcarUsuario } = props;

    //popover activo (compartido para toda la tabla), abrir uno nuevo reemplaza al anterior
    //con un temporizador para quitarse despues de 100 milisegundos de tener el raton fuera
    const [activo, setActivo] = useState<{ nombre: string, x: number, y: number } | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    //cancela cualquier cierre pendiente
    const cancelarCierre = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    //abre (o reemplaza) el popover anclado al lado derecho del elemento dado
    const abrir = (nombre: string, evento: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>) => {
        cancelarCierre();
        const rect = evento.currentTarget.getBoundingClientRect();
        //y al centro vertical del nombre, el popover se centra con translateY(-50%) en css
        setActivo({ nombre, x: rect.right + 8, y: rect.top + rect.height / 2 });
    };

    //programa el cierre con margen para que el mouseenter del popover pueda cancelarlo antes de desmontarlo
    const cerrar = () => {
        cancelarCierre();
        timeoutRef.current = setTimeout(() => setActivo(null), 100);
    };

    //spinner solo en la carga inicial (sin datos previos), en refrescos posteriores se mantiene la tabla visible para no desmontar popovers ni dar parpadeos
    if (loading && users.length === 0) return (
        <div className="ranking-card">
            <div className="d-flex justify-content-center p-5">
                <Spinner animation="border" variant="primary" />
            </div>
        </div>
    );

    //tabla vacia: filtros sin resultados o pagina fuera de rango
    if (users.length === 0) return (
        <div className="ranking-card">
            <div className="ranking-vacio">No hay usuarios para mostrar.</div>
        </div>
    );

    return (
        <div className="ranking-card">
            <table className="ranking-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Usuario</th>
                        <th className="ranking-nivel">Nivel</th>
                        <th className="ranking-xp">XP</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((usuario: datoUsuario) => {
                        //marca la fila del usuario seleccionado para resaltarla visualmente
                        const esUsuario = usuarioDestacado !== "" && usuario.nombre === usuarioDestacado;
                        //estilo especial para los 3 primeros del podio
                        const claseTop = usuario.pos === 1 ? "top1" : usuario.pos === 2 ? "top2" : usuario.pos === 3 ? "top3" : "";
                        return (
                            <tr key={usuario.nombre} className={esUsuario ? "fila-usuario" : ""}>
                                <td className={`ranking-pos ${claseTop}`}>{usuario.pos}</td>
                                <td>
                                    {/*el nombre es un link directo a las estadisticas*/}
                                    <Link
                                        to={`/usuarios/estadisticas/${usuario.nombre}`}
                                        className="usuario-link"
                                        onMouseEnter={(evento) => abrir(usuario.nombre, evento)}
                                        onMouseLeave={cerrar}
                                        onFocus={(evento) => abrir(usuario.nombre, evento)}
                                        onBlur={cerrar}
                                    >
                                        {usuario.nombre}
                                    </Link>
                                </td>
                                <td className="ranking-nivel">
                                    <EtiquetaNivel
                                        evento={formatEvent(usuario.nombre, EventType.USUARIO_NIVEL)}
                                        nivel={usuario.nivel as NivelUsuario}
                                        className="ranking-nivel-etiqueta"
                                    />
                                </td>
                                <td className="ranking-xp">{usuario.xp}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {activo !== null && createPortal(
                <div
                    className="ranking-popover-flotante"
                    style={{ left: activo.x, top: activo.y }}
                    onMouseEnter={cancelarCierre}
                    onMouseLeave={cerrar}
                >
                    <Link
                        to={`/usuarios/estadisticas/${activo.nombre}`}
                        className="ranking-popover-item"
                    >
                        Ver estadísticas
                    </Link>
                    <Link
                        to={`/usuarios/logros/${activo.nombre}`}
                        className="ranking-popover-item"
                    >
                        Ver logros
                    </Link>
                    {activo.nombre !== usuarioDestacado && (
                        <button
                            type="button"
                            className="ranking-popover-item"
                            onClick={() => { onMarcarUsuario(activo.nombre); setActivo(null); }}
                        >
                            Marcar en el ranking
                        </button>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
}
