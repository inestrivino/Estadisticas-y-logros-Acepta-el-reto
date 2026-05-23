import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PlantillaTarjetaInformacio from "./plantillaTarjetaInformacion";

import { faTrophy } from "@fortawesome/free-solid-svg-icons/faTrophy";
import { colorCategoriaLogro } from "../Logro/colorDeCategoriaLogro";
import { CategoriaLogro } from "shared";

export default function TarjetaInfoLogros() {

    return (
        <PlantillaTarjetaInformacio
            titulo="Logros"
            icono={<FontAwesomeIcon icon={faTrophy} style={{ color: "rgb(114, 172, 211)", fontSize: "5rem" }} />}
            contenido={
                <>
                    <div>
                        <p>
                            Desbloquea logros al completar distintos objetivos relacionados con actividad, calidad de
                            soluciones y progreso. Cada logro otorga XP y permanece desbloqueado de forma permanente
                            una vez conseguido.
                        </p>

                        <p>
                            Además, cada logro tiene asociado un nivel y una categoría que determina el aspecto que premia.
                        </p>

                        <p className="titulo-apartado">Niveles de logros:</p>
                        <div style={{ display: "flex", gap: "0.6rem", margin: "0.5rem 0 0.2rem" }}>
                            <span className="nivel-logro bronce"><img src="/logros/trofeo_bronce_placeholder.png" style={{ width: "18px" }} /> Bronce</span>
                            <span className="nivel-logro plata"><img src="/logros/trofeo_plata_placeholder.png" style={{ width: "18px" }} /> Plata</span>
                            <span className="nivel-logro oro"><img src="/logros/trofeo_oro_placeholder.png" style={{ width: "18px" }} /> Oro</span>
                        </div>

                        <small>La dificultad y recompensa del logro dependen de su nivel.</small>

                        <p className="titulo-apartado">Categorías de logros</p>
                        <table className="tabla-categorias-logros">
                            <thead>
                                <tr>
                                    <th>Categoría</th>
                                    <th>Descripción</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ color: colorCategoriaLogro(CategoriaLogro.ONBOARDING) }}>Onboarding</td>
                                    <td>Primeros pasos dentro de la aplicación</td>
                                </tr>
                                <tr>
                                    <td style={{ color: colorCategoriaLogro(CategoriaLogro.PROBLEMAS) }}>Problemas</td>
                                    <td>Cantidad de ejercicios resueltos</td>
                                </tr>
                                <tr>
                                    <td style={{ color: colorCategoriaLogro(CategoriaLogro.LENGUAJES) }}>Lenguajes</td>
                                    <td>Uso de distintos lenguajes de programación</td>
                                </tr>
                                <tr>
                                    <td style={{ color: colorCategoriaLogro(CategoriaLogro.RACHAS) }}>Rachas</td>
                                    <td>Actividad y constancia</td>
                                </tr>
                                <tr>
                                    <td style={{ color: colorCategoriaLogro(CategoriaLogro.CALIDAD) }}>Calidad</td>
                                    <td>Rendimiento y eficiencia de soluciones</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="logros-sorpresa">
                            <span>También hay <strong>logros sorpresa</strong> que permanecen ocultos hasta ser desbloqueados.</span>
                        </div>
                    </div>
                </>

            }
            tituloEnlace="Ir a logros de usuario"
            direccionEnlace="usuarios/logros"
            enlaceExterno={false}
        />
    )
}