import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Badge from 'react-bootstrap/Badge';

import { useAppContext } from "../contexto/contextos";
import PlantillaBusqueda from "../componentes/plantillaBusqueda";
import Buscador from "../componentes/buscador";
import EstadisticasUsuarioComp from "../componentes/estadisticasUsuarioComp";

export default function EstadisticasUsuario() {

    const appContext = useAppContext();
    const params = useParams();

    const usuario = params.usuario || appContext?.usuarioActual;

    const navigate = useNavigate();
    useEffect(() => {
        navigate(`/usuarios/estadisticas/${usuario}`, { replace: true });
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
            tituloBusqueda="Estadísticas de usuarios"
            descripcion="Aquí podrás buscar cualquier usuario de ¡Acepta el reto! y observar sus estadísticas"
            tituloResultado={
                <>
                    Estadisticas usuario <b>{usuario}</b> <Badge bg="secondary">{nivel}</Badge>
                </>
            }
            buscador={<Buscador tipo="usuario_estadistica" ruta={`/usuarios/estadisticas/${usuario}`} />}
            children={usuario && <EstadisticasUsuarioComp key={usuario} usuario={usuario} />}
        />
    )
}