import { useNavigate, useParams } from "react-router-dom"
import { useEffect } from "react";
import { useAppContext } from "../contexto/contextos"
import PlantillaBusqueda from "../componentes/plantillaBusqueda";
import Buscador from "../componentes/buscador";
import EstadisticasProblemaComp from "../componentes/EstadisticasProblemaComp/estadisticasProblemaComp";

export default function EstadisticasProblema() {

    const appContext = useAppContext();
    const params = useParams();

    const problema = params.problema || appContext?.problemaActual;

    const navigate = useNavigate();
    useEffect(() => {
        navigate(`/problemas/${problema}`, { replace: true });
    }, [problema, navigate]);

    return (
        <PlantillaBusqueda
            hasResult={!!problema}
            tituloBusqueda="Estadísticas de problemas"
            descripcion="Aquí podrás buscar cualquier problema de ¡Acepta el reto! y observar sus estadísticas"
            tituloResultado={
                <>
                    Estadisticas problema <b>{problema}</b>
                </>
            }
            buscador={<Buscador tipo="problema_estadistica" ruta={`/problemas/${problema}`} />}
            children={problema && <EstadisticasProblemaComp key={problema} problema={problema} />}
        />
    )
}