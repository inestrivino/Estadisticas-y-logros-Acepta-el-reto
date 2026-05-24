import { useEffect, useState } from "react";
import PlantillaBusqueda from "../componentes/plantillaBusqueda";
import Buscador from "../componentes/Buscador/buscador";
import EstadisticasProblemaComp from "../componentes/EstadisticasProblemaComp/estadisticasProblemaComp";

export default function EstadisticasProblema() {

    //problema confirmado tras pulsar buscar, solo cambia en commits (URL inicial, localStorage o onResultado), no en cada tecla
    const [problema, setProblema] = useState<string>(() =>
        new URLSearchParams(window.location.search).get("problema") || localStorage.getItem("problema") || ""
    );

    const [problemaExiste, setProblemaExiste] = useState<boolean | null>(null);
    useEffect(() => {
        if (!problema) return;

        setProblemaExiste(null);
        fetch(`/api/problemas/${encodeURIComponent(problema)}`)
            .then(res => res.json())
            .then(data => {
                setProblemaExiste(data.existe);
            });
    }, [problema]);

    return (
        <PlantillaBusqueda
            hasResult={problemaExiste === true}
            mensajeDeNoEncontrado={problemaExiste === false && problema !== "" ? `El problema "${problema}" no existe` : ""}
            tituloBusqueda="Estadísticas de problemas"
            descripcion="Aquí podrás buscar cualquier problema de ¡Acepta el reto! y observar sus estadísticas"
            buscador={
                <Buscador
                    tipo="problema_estadistica"
                    ruta={`/problemas?problema=${problema}`}
                    valorInicial={problema}
                    paramKey="problema"
                    onResultado={(valor) => setProblema(valor)}
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