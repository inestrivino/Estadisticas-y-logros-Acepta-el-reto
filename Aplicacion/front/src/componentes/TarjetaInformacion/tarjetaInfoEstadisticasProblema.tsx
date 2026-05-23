import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartPie } from "@fortawesome/free-solid-svg-icons/faChartPie";

import PlantillaTarjetaInformacio from "./plantillaTarjetaInformacion";

export default function TarjetaInfoEstadisticasProblema() {

    return (
        <PlantillaTarjetaInformacio
            titulo="Estadísticas de problema"
            icono={<FontAwesomeIcon icon={faChartPie} style={{ color: "rgb(114, 172, 211)", fontSize: "5rem" }} />}
            contenido={
                <>
                    <div className="xp-system app-listado">
                        <p>
                            La aplicación también permite consultar información detallada sobre cada ejercicio de la plataforma.
                        </p>

                        <p className="titulo-apartado">En este apartado podrás consultar:</p>
                        <ul className="lista-informacion">
                            <li>el número de envíos realizados a ese problema</li>
                            <li>el mejor tiempo de ejecución de este</li>
                            <li>el tiempo medio de ejecución</li>
                            <li>la distribución de veredictos obtenidos</li>
                            <li>lenguajes de programación empleados</li>                          
                        </ul>
                    </div>
                </>

            }
            tituloEnlace="Ir a estadísticas problema"
            direccionEnlace="problemas"
            enlaceExterno={false}
        />
    )
}