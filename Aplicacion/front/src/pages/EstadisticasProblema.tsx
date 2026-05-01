import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react";
import PlantillaBusqueda from "../componentes/plantillaBusqueda";
import Buscador from "../componentes/Buscador/buscador";
import EstadisticasProblemaComp from "../componentes/EstadisticasProblemaComp/estadisticasProblemaComp";

export default function EstadisticasProblema() {

    const params = useParams();

    const problema = params.problema || localStorage.getItem("problemaActual") || "";

    const [problemaExiste, setProblemaExiste] = useState<boolean | null>(null);
    useEffect(() => {
        if (!problema) return;

        fetch(`/api/problemas/${problema}`)
            .then(res => res.json())
            .then(data => {
                setProblemaExiste(data.existe);
            });
    }, [problema]);

    const navigate = useNavigate();
    useEffect(() => {
        navigate(`/problemas/${problema}`, { replace: true });
    }, [problema, navigate]);

    return (
        <PlantillaBusqueda
            hasResult={problemaExiste === true}
            mensajeDeNoEncontrado={!problemaExiste && problema !== "" ? `El problema "${problema}" no existe` : ""}
            tituloBusqueda="Estadísticas de problemas"
            descripcion="Aquí podrás buscar cualquier problema de ¡Acepta el reto! y observar sus estadísticas"
            buscador={
                <Buscador
                    tipo="problema_estadistica"
                    ruta={`/problemas/estadisticas/${problema}`}
                    valorInicial={problema}
                    prefijo={problema
                        ? <>
                            <span className="text-truncate">
                                Estadísticas ejercicio <b className="ms-1">{problema}</b>
                            </span>
                        </>
                        : undefined
                    }
                />
            }
            children={problema && <EstadisticasProblemaComp key={problema} problema={problema} />}
        />
    )
}