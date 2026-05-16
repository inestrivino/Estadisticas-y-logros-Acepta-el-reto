import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Badge from 'react-bootstrap/Badge';

import PlantillaBusqueda from "../componentes/plantillaBusqueda";
import Buscador from "../componentes/Buscador/buscador";
import EstadisticasUsuarioComp from "../componentes/estadisticasUsuarioComp";
import EtiquetaNivel from "../componentes/etiquetaNivel";
import { EventType, formatEvent } from "shared";
import { NivelUsuario } from "shared/NivelUsuarios";

export default function EstadisticasUsuario() {

    const params = useParams();

    const usuario = params.usuario || localStorage.getItem("usuarioActual") || "";

    const [usuarioExiste, setUsuarioExiste] = useState<boolean | null>(null);
    useEffect(() => {
        if (!usuario) return;
        setUsuarioExiste(null);
        fetch(`/api/usuarios/${usuario}`)
            .then(res => res.json())
            .then(data => {
                setUsuarioExiste(data.existe);
                if (data.existe && usuario !== localStorage.getItem("usuarioActual")) {
                    localStorage.setItem("usuarioActual", usuario);
                }
            });
    }, [usuario]);

    const navigate = useNavigate();
    useEffect(() => {
        if(!usuarioExiste) return;
        navigate(`/usuarios/estadisticas/${usuario}`, { replace: true });
    }, [usuario, usuarioExiste, navigate]);

    // NIVEL
    const [nivel, setNivel] = useState<NivelUsuario>(NivelUsuario.SIN_NIVEL);
    useEffect(() => {
        if (usuarioExiste) {
            fetch(`/api/usuarios/${usuario}/nivel`)
                .then(response => response.json())
                .then(data => setNivel(data));
        }

    }, [usuario, usuarioExiste]);

    return (
        <PlantillaBusqueda
            hasResult={usuarioExiste === true}
            mensajeDeNoEncontrado={usuarioExiste === false && usuario !== "" ? `El usuario "${usuario}" no existe` : ""}
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
                            {nivel &&
                                <EtiquetaNivel
                                    evento={formatEvent(usuario, EventType.USUARIO_NIVEL)}
                                    nivel={nivel}
                                />
                            }

                        </>
                        : undefined
                    }
                />
            }
            children={usuarioExiste === true && usuario !== "" && <EstadisticasUsuarioComp key={usuario} usuario={usuario} />}
        />
    )
}