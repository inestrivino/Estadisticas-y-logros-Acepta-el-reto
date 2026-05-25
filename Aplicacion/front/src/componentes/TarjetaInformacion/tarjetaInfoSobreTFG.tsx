import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons/faGithub";

import PlantillaTarjetaInformacio from "./plantillaTarjetaInformacion";

export default function TarjetaInfoSobreTFG() {

    return (
        <PlantillaTarjetaInformacio
            titulo="Sobre el origen de esta página"
            icono={<FontAwesomeIcon icon={faGithub} style={{color: "rgb(114, 172, 211)", fontSize: "5rem" }} />}
            contenido={
                <>
                    <div>
                        <p>
                            Esta página forma parte de un Trabajo de Fin de Grado que incorpora un panel de
                            estadísticas con información sobre los problemas y los usuarios de la plataforma.
                        </p>
                        <p>
                            También incluye un sistema de logros que proporciona insignias a los usuarios
                            para fomentar su actividad dentro de la plataforma.
                        </p>
                    </div>
                </>

            }
            tituloEnlace="Ir al repositorio de github"
            direccionEnlace="https://github.com/inestrivino/Estadisticas-y-logros-Acepta-el-reto"
            enlaceExterno={true}
        />
    )
}