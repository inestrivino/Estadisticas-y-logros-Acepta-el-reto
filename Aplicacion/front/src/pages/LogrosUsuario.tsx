import { useEffect, useState } from "react";
import Badge from 'react-bootstrap/Badge';

import PlantillaBusqueda from "../componentes/plantillaBusqueda";
import Buscador from "../componentes/Buscador/buscador";
import LogrosUsuarioComp from "../componentes/LogrosUsuarioComp/logrosUsuarioComp";
import EtiquetaNivel from "../componentes/EtiquetaNivel/etiquetaNivel";
import { EventType, formatEvent } from "shared";
import { NivelUsuario } from "shared";

export default function LogrosUsuario() {

    //usuario confirmado tras pulsar buscar, solo cambia en commits (URL inicial, localStorage o onResultado), no en cada tecla
    const [usuario, setUsuario] = useState<string>(() =>
        new URLSearchParams(window.location.search).get("usuario") || localStorage.getItem("usuario") || ""
    );

    const [usuarioExiste, setUsuarioExiste] = useState<boolean | null>(null);
    useEffect(() => {
        if (!usuario) return;
        setUsuarioExiste(null);
        fetch(`/api/usuarios/${encodeURIComponent(usuario)}`)
            .then(res => res.json())
            .then(data => {
                setUsuarioExiste(data.existe);
                if (data.existe && usuario !== localStorage.getItem("usuario")) {
                    localStorage.setItem("usuario", usuario);
                }
            });
    }, [usuario]);

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
            tituloBusqueda="Logros de usuarios"
            descripcion="Aquí podrás buscar cualquier usuario de ¡Acepta el reto! y observar sus logros alcanzados"
            buscador={
                <Buscador
                    tipo="usuario_logro"
                    ruta={`/usuarios/logros?usuario=${usuario}`}
                    valorInicial={usuario}
                    paramKey="usuario"
                    onResultado={(valor) => setUsuario(valor)}
                    prefijo={usuario
                        ? <>
                            <span className="text-truncate">
                                Logros de <b className="ms-1">{usuario}</b>
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
            children={usuarioExiste === true && usuario !== "" && <LogrosUsuarioComp key={usuario} usuario={usuario} />}
        />
    )
}