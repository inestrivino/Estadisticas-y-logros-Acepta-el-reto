import Table from "react-bootstrap/Table";
import Pagination from "react-bootstrap/Pagination";
import Spinner from "react-bootstrap/Spinner";
import Form from 'react-bootstrap/Form';
import { useState, useEffect } from "react";
import { useAppContext } from "../contexto/contextos";

type datoUsuario = {
    nombre: string,
    nivel?: string,
    xp: number
};

export default function TablaDeClasificacion() {

    const [porNivel, setPorNivel] = useState(false);
    const [users, setUsers] = useState<datoUsuario[]>([]);
    const [pag, setPag] = useState(1);
    const [totalPags, setTotalPags] = useState(1);
    const [loading, setLoading] = useState(false);

    const pagSize = 10;

    const appContext = useAppContext();

    const usuario = appContext?.usuarioActual;

    useEffect(() => {
        fetchRanking(pag);
    }, [pag, porNivel]);

    const fetchRanking = async (pag: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/usuarios/ranking?pag=${pag}&tam=${pagSize}` + (porNivel ? `&usuario=${usuario}` : ""));
            const data = await res.json();

            setUsers(data.usuarios);
            setTotalPags(Math.ceil(data.totalUsuarios / pagSize));
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div>
            <h1 className="p-4 text-3xl font-bold">
                Ranking usuarios ¡Acepta el reto!
            </h1>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                {usuario && <Form.Check
                    className="mb-2"
                    type="switch"
                    id="toggle-check"
                    dir="rtl"
                    label="Filtrar por nivel"
                    checked={porNivel}
                    onChange={(e) => { setPorNivel(e.currentTarget.checked); setPag(1) }}
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
                            {users.map((u: datoUsuario, index) => (
                                <tr key={u.nombre}>
                                    <td>{(pag - 1) * pagSize + index + 1}</td>
                                    <td>{u.nombre}</td>
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

                        <Pagination.Item key={pag} active={true} onClick={() => setPag(pag)}>
                            {pag}
                        </Pagination.Item>

                        {pag !== totalPags && <Pagination.Ellipsis />}
                        <Pagination.Next onClick={() => setPag(pag + 1)} disabled={pag === totalPags} />
                    </Pagination>
                </div>

            </div>
        </div>
    );
}
