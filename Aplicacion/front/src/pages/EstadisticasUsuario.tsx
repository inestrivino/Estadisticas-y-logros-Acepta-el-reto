import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Badge from 'react-bootstrap/Badge';

import PlantillaBusqueda from "../componentes/plantillaBusqueda";
import Buscador from "../componentes/Buscador/buscador";
import EstadisticasUsuarioComp from "../componentes/estadisticasUsuarioComp";

export default function EstadisticasUsuario() {

    const params = useParams();

    const usuario = params.usuario || localStorage.getItem("usuarioActual") || "";

    const [usuarioExiste, setUsuarioExiste] = useState<boolean | null>(null);
    useEffect(() => {
        if (!usuario) return;

        fetch(`/api/usuarios/${usuario}`)
            .then(res => res.json())
            .then(data => {
                setUsuarioExiste(data.existe);
            });
    }, [usuario]);

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
            hasResult={usuarioExiste === true}
            mensajeDeNoEncontrado={!usuarioExiste && usuario !== "" ? `El usuario "${usuario}" no existe` : ""}
            tituloBusqueda="Estadísticas de usuarios"
            descripcion="Aquí podrás buscar cualquier usuario de ¡Acepta el reto! y observar sus estadísticas"
            buscador={
                <Buscador
                    tipo="usuario_estadistica"
                    ruta={`/usuarios/estadisticas/${usuario}`}
                    valorInicial={usuario}
                    prefijo={usuario
                        ? <>
                            <span className="text-truncate">
                                Estadísticas de <b className="ms-1">{usuario}</b>
                            </span>
                            {nivel && <Badge bg="secondary" className="ms-2">{nivel}</Badge>}

                        </>
                        : undefined
                    }
                />
            }
            children={usuario && <EstadisticasUsuarioComp key={usuario} usuario={usuario} />}
        />
    )
}