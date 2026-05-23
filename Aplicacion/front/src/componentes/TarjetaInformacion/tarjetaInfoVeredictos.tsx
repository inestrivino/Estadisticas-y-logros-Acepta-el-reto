import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons/faCircleQuestion";

import PlantillaTarjetaInformacio from "./plantillaTarjetaInformacion";

export default function TarjetaInfoAdicional() {

    return (
        <PlantillaTarjetaInformacio
            titulo="Más información que te pueda interesar"
            icono={<FontAwesomeIcon icon={faCircleQuestion} style={{ color: "rgb(114, 172, 211)", fontSize: "5rem" }} />}
            contenido={
                <>
                    <div>
                        <p className="titulo-apartado">
                            ¿Qué significan las siglas de los veredictos de los envíos?
                        </p>

                        <div className="lista-dos-columnas lg:grid grid-cols-1 grid-cols-2" style={{ gap: "0 1rem" }}>
                            <ul className="lista-informacion">
                                <li><strong>AC:</strong> Accepted</li>
                                <li><strong>WA:</strong> Wrong Answer</li>
                                <li><strong>TLE:</strong> Time Limit Exceeded</li>
                                <li><strong>CE:</strong> Compilation Error</li>
                                <li><strong>RTE:</strong> Run-time Error</li>
                            </ul>
                            <ul className="lista-informacion">
                                <li><strong>IR:</strong></li>
                                <li><strong>ML:</strong> Memory Limit Exceeded</li>
                                <li><strong>OL:</strong> Output limit exceeded</li>
                                <li><strong>PE:</strong> Presentation Error</li>
                                <li><strong>RF:</strong> Restricted Function</li>
                            </ul>
                        </div>



                    </div>
                </>

            }
            tituloEnlace="Ir a explicación de cada veredicto"
            direccionEnlace="https://aceptaelreto.com/doc/verdicts.php"
            enlaceExterno={true}
        />
    )
}