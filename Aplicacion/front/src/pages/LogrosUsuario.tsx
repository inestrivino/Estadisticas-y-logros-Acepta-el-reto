import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Badge from 'react-bootstrap/Badge';

import PlantillaBusqueda from "../componentes/plantillaBusqueda";
import Buscador from "../componentes/Buscador/buscador";
import LogrosUsuarioComp from "../componentes/LogrosUsuarioComp/logrosUsuarioComp";

export default function LogrosUsuario() {
    const params = useParams();

    const usuario = params.usuario || localStorage.getItem("usuarioActual") || "";
    const [searchParams, setSearchParams] = useSearchParams();

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
        const clasificacionGuardada = searchParams.get("clasificacion")
            ?? localStorage.getItem("clasificacion")
            ?? "nivel";
        navigate(`/usuarios/logros/${usuario}?clasificacion=${clasificacionGuardada}`, { replace: true });
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
            tituloBusqueda="Logros de usuarios"
            descripcion="Aquí podrás buscar cualquier usuario de ¡Acepta el reto! y observar sus logros alcanzados"
            buscador={
                <Buscador
                    tipo="usuario_logro"
                    ruta={`/usuarios/logros/${usuario}`}
                    valorInicial={usuario}
                    prefijo={usuario
                        ? <>
                            <span className="text-truncate">
                                Logros de <b className="ms-1">{usuario}</b>
                            </span>
                            {nivel && <Badge bg="secondary" className="ms-2">{nivel}</Badge>}

                        </>
                        : undefined
                    }
                />
            }
            children={usuario && <LogrosUsuarioComp key={usuario} usuario={usuario} />}
        />
    )
}