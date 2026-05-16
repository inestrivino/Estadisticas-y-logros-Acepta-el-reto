import Spinner from "react-bootstrap/Spinner";
import { Link } from "react-router-dom";
import { EventType, formatEvent } from "shared";
import { NivelUsuario } from "shared/NivelUsuarios.ts";
import { datoUsuario } from "./utils.ts";
import EtiquetaNivel from "../EtiquetaNivel/etiquetaNivel.tsx";

/**
 * Tabla del ranking con el listado de usuarios.
 */
export default function TablaRanking(props: {
    users: datoUsuario[],
    loading: boolean,
    usuarioDestacado: string,
}) {
    const { users, loading, usuarioDestacado } = props;

    //mientras se cargan los datos se muestra un spinner en lugar de la tabla
    if (loading) return (
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
                    {users.map((u: datoUsuario) => {
                        //marca la fila del usuario seleccionado para resaltarla visualmente
                        const esUsuario = !!usuarioDestacado && u.nombre === usuarioDestacado;
                        //estilo especial para los 3 primeros del podio
                        const claseTop = u.pos === 1 ? "top1" : u.pos === 2 ? "top2" : u.pos === 3 ? "top3" : "";
                        return (
                            <tr key={u.nombre} className={esUsuario ? "fila-usuario" : ""}>
                                <td className={`ranking-pos ${claseTop}`}>{u.pos}</td>
                                <td>
                                    {/* el nombre lleva a las estadisticas del usuario */}
                                    <Link to={`/usuarios/estadisticas/${u.nombre}`} className="usuario-link">
                                        {u.nombre}
                                    </Link>
                                </td>
                                <td className="ranking-nivel">
                                    <EtiquetaNivel
                                        evento={formatEvent(u.nombre, EventType.USUARIO_NIVEL)}
                                        nivel={u.nivel as NivelUsuario}
                                        className="ranking-nivel-etiqueta"
                                    />
                                </td>
                                <td className="ranking-xp">{u.xp}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
