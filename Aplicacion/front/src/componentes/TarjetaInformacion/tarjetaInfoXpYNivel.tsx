import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons/faStar";
import PlantillaTarjetaInformacio from "./plantillaTarjetaInformacion";

import { colorDelNivel } from "../EtiquetaNivel/colorDelNivel";
import { NivelUsuario } from "shared";

export default function TarjetaInfoXpYNivel() {

    return (
        <PlantillaTarjetaInformacio
            titulo="XP y Niveles"
            icono={<FontAwesomeIcon icon={faStar} style={{ color: "rgb(114, 172, 211)", fontSize: "5rem" }} />}
            contenido={
                <>
                    <div>
                        <p>
                            Esta aplicación incorpora un sistema de experiencia (XP) que recompensa
                            la actividad dentro de la plataforma. Tu XP determina tu nivel de dominio
                            dentro de la plataforma.
                        </p>

                        <p className="titulo-apartado">Niveles disponibles:</p>
                        <table className="tabla-niveles-xp">
                            <thead>
                                <tr>
                                    <th>Nivel</th>
                                    <th style={{ textAlign: "center" }}>Rango XP</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ color: colorDelNivel(NivelUsuario.APRENDIZ) }}>Aprendiz</td>
                                    <td className="rango-xp">
                                        <span>1</span>
                                        <span>–</span>
                                        <span>499</span>
                                        <span>XP</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ color: colorDelNivel(NivelUsuario.COMPETENTE) }}>Competente</td>
                                    <td className="rango-xp">
                                        <span>500</span>
                                        <span>–</span>
                                        <span>999</span>
                                        <span>XP</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ color: colorDelNivel(NivelUsuario.HABIL) }}>Hábil</td>
                                    <td className="rango-xp">
                                        <span>1000</span>
                                        <span>–</span>
                                        <span>1999</span>
                                        <span>XP</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ color: colorDelNivel(NivelUsuario.ESPECIALISTA) }}>Especialista</td>
                                    <td className="rango-xp">
                                        <span>2000</span>
                                        <span>–</span>
                                        <span>4999</span>
                                        <span>XP</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ color: colorDelNivel(NivelUsuario.PROFESIONAL) }}>Profesional</td>
                                    <td className="rango-xp">
                                        <span>5000</span>
                                        <span>–</span>
                                        <span></span>
                                        <span>XP</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <p className="titulo-apartado">¿Cómo ganas puntos de experiencia?</p>
                        <p>
                            Consigues puntos de experiencia al realizar envíos y desbloquear logros. El XP
                            acumulado nunca disminuye y determina tu posición en las clasificaciones de la plataforma.
                        </p>

                        <p>
                            Podrás consultar tu posición y la del resto de usuarios en la tabla de
                            clasificación. También podrás filtrar la tabla por tu nivel y compararte
                            con usuarios de tu mismo nivel.
                        </p>
                    </div>
                </>

            }
            tituloEnlace="Ir a tabla de clasificación"
            direccionEnlace="usuarios/ranking"
        />
    )
}