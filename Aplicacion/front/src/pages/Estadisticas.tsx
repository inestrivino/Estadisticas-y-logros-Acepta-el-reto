import { useParams, useNavigate } from "react-router-dom";
import Buscador from "../componentes/buscador";
import EstadisticasProblema from "../componentes/EstadisticasProblema/EstadisticasProblema";
import EstadisticasUsuario from "../componentes/EstadisticasUsuario";
import { useAppContext } from "../contexto/contextos";
import { useEffect } from "react";


type Params = {
    problema?: string;
    usuario?: string;
};

type Textos = {
    tituloBusqueda: string;
    tituloResultado: (id: string) => string;
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
                                {tituloResultado(id)}
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
            tituloResultado: (id) => `Estadísticas problema ${id}`,
            descripcion: "Aquí podrás buscar cualquier problema de ¡Acepta el reto! y observar sus estadísticas"
        };
    } else {
        return {
            tituloBusqueda: "Estadísticas usuarios",
            tituloResultado: (id) => `Estadísticas de ${id}`,
            descripcion: "Aquí podrás buscar cualquier usuario y observar sus estadísticas"
        };
    }
}