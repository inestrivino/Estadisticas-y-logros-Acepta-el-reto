import { useParams, useNavigate } from "react-router-dom";
import Buscador from "../componentes/buscador";
import EstadisticasProblema from "../componentes/EstadisticasProblemaComp/estadisticasProblemaComp";
import EstadisticasUsuario from "../componentes/estadisticasUsuarioComp";
import { useAppContext } from "../contexto/contextos";
import { useEffect, useState } from "react";
import Badge from 'react-bootstrap/Badge';


type Params = {
    problema?: string;
    usuario?: string;
};

type Textos = {
    tituloBusqueda: string;
    tituloResultado: (id: string, nivel?: string) => React.ReactNode;
    descripcion: string;
};

export default function Estadisticas(props: {
    tipo: string
}) {

    const appContext = useAppContext();

    const params = useParams<Params>();
    const id = (props.tipo === "problema" ? params.problema || appContext?.problemaActual : params.usuario) || appContext?.usuarioActual;

    const navigate = useNavigate();

    useEffect(() => {
        if (props.tipo === "problema") {
            if (!params.problema && appContext?.problemaActual) {
                navigate(`/problemas/${appContext.problemaActual}`, { replace: true });
            }
        }
        else {
            if (!params.usuario && appContext?.usuarioActual) {
                navigate(`/usuarios/estadisticas/${appContext.usuarioActual}`, { replace: true });
            }
        }
    }, [props.tipo, params.problema, params.usuario, appContext?.problemaActual, appContext?.usuarioActual, navigate]);

    // NIVEL
    const [nivel, setNivel] = useState<string>("");
    useEffect(() => {
        if (props.tipo === "usuario") {
            fetch(`/api/usuarios/${id}/nivel`)
                .then(response => response.json())
                .then(data => setNivel(data));
        } else
            setNivel("");
    }, [id]);

    const { tituloBusqueda, tituloResultado, descripcion } = initEstado(props.tipo);

    return (
        <>
            <div className={`${id ? "w-full" : "max-w-6xl mx-auto"} px-4 sm:px-6 lg:px-8 mt-4`}>
                <div className={`container transition-all duration-700 ${id ? "con-resultados" : ""}`}>

                    {!id ? (
                        // vista cuando no se ha seleccionado ningun problema / usuario
                        <div className="flex flex-col justify-center items-center text-center min-h-[80vh] transition-all duration-700">

                            {<h1 className="mb-3 text-3xl font-bold">
                                {tituloBusqueda}
                            </h1>}

                            {<p className="text-muted mb-4">
                                {descripcion}
                            </p>}

                            <div className="w-full max-w-md">
                                <Buscador tipo={props.tipo} />
                            </div>

                        </div>
                    ) : (
                        // vista cuando se estan viendo las estadisticas de un problema / usuario
                        <div className="transition-all duration-700">

                            <div className="flex justify-center mb-6">
                                <div className="w-full max-w-md">
                                    <Buscador tipo={props.tipo} />
                                </div>
                            </div>

                            <h1 className="text-3xl font-bold mb-4">
                                {tituloResultado(id, nivel)}
                            </h1>

                            {props.tipo === "problema" ? (
                                <EstadisticasProblema key={id} problema={id} />
                            ) : (
                                <EstadisticasUsuario key={id} usuario={id} />
                            )}

                        </div>
                    )}

                </div>
            </div>
        </>
    )
}

function initEstado(tipo: string): Textos {
    if (tipo === "problema") {
        return {
            tituloBusqueda: "Estadísticas problemas",
            tituloResultado: (id) => (
                <h1>
                    Estadisticas problema <b>{id}</b>
                </h1>
            ),
            descripcion: "Aquí podrás buscar cualquier problema de ¡Acepta el reto! y observar sus estadísticas"
        };
    } else {
        return {
            tituloBusqueda: "Estadísticas usuarios",
            tituloResultado: (id, nivel) => (
                <h1>
                    Estadisticas usuario <b>{id}</b> <Badge bg="secondary">{nivel}</Badge>
                </h1>
            ),
            descripcion: "Aquí podrás buscar cualquier usuario y observar sus estadísticas"
        };
    }
}