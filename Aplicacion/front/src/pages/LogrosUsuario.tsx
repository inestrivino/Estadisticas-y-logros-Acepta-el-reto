import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Badge from 'react-bootstrap/Badge';

import { useAppContext } from "../contexto/contextos";
import PlantillaBusqueda from "../componentes/plantillaBusqueda";
import Buscador from "../componentes/buscador";
import LogrosUsuarioComp from "../componentes/LogrosUsuarioComp/logrosUsuarioComp";

export default function LogrosUsuario() {
    const appContext = useAppContext();
    const params = useParams();

    const usuario = params.usuario || appContext?.usuarioActual;

    const navigate = useNavigate();
    useEffect(() => {
        navigate(`/usuarios/logros/${usuario}`, { replace: true });
    }, [usuario, navigate]);

    // NIVEL
    const [nivel, setNivel] = useState<string>("");
    useEffect(() => {
        fetch(`/api/usuarios/${usuario}/nivel`)
            .then(response => response.json())
            .then(data => setNivel(data));
    }, [usuario]);

    return (
        <PlantillaBusqueda
            hasResult={!!usuario}
            tituloBusqueda="Logros de usuarios"
            descripcion="Aquí podrás buscar cualquier usuario de ¡Acepta el reto! y observar sus logros alcanzados"
            tituloResultado={
                <h1>
                    Logros usuario <b>{usuario}</b> <Badge bg="secondary">{nivel}</Badge>
                </h1>
            }
            buscador={<Buscador tipo="usuario_logro" ruta={`/usuarios/logros/${usuario}`} />}
            children={usuario && <LogrosUsuarioComp key={usuario} usuario={usuario} />}
        />
    )
}