import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine } from "@fortawesome/free-solid-svg-icons/faChartLine";

import PlantillaTarjetaInformacio from "./plantillaTarjetaInformacion";

export default function TarjetaInfoEstadisticasUsuario() {

    return (
        <PlantillaTarjetaInformacio
            titulo="Estadísticas de usuario"
            icono={<FontAwesomeIcon icon={faChartLine} style={{ color: "rgb(114, 172, 211)", fontSize: "5rem" }} />}
            contenido={
                <>
                    <div className="xp-system app-listado">
                        <p>
                            Cada usuario dispone de un panel de estadísticas que permite visualizar su actividad y
                            evolución dentro de la plataforma.
                        </p>

                        <p className="titulo-apartado">En este apartado podrás consultar:</p>

                        <ul className="lista-informacion">
                            <li>tu posición en la clasificación global</li>
                            <li>el número de problemas que has resuelto</li>
                            <li>tu racha actual de envíos correctos (AC)</li>
                            <li>tu racha máxima de envíos correctos</li>
                            <li>tu evolución de xp en el último año</li>
                            <li>tu evolución de envíos en el último año</li>
                            <li>tu distribución de veredictos obtenidos</li>
                            <li>lenguajes de programación que has utilizado</li>                            
                        </ul>
                    </div>
                </>

            }
            tituloEnlace="Ir a estadísticas usuario"
            direccionEnlace="usuarios/estadisticas"
            enlaceExterno={false}
        />
    )
}