import TarjetaInfoXpYNivel from "../componentes/TarjetaInformacion/tarjetaInfoXpYNivel"
import TarjetaInfoLogros from "../componentes/TarjetaInformacion/tarjetaInfoLogros"
import TarjetaInfoEstadisticasUsuario from "../componentes/TarjetaInformacion/tarjetaInfoEstadisticasUsuario"
import TarjetaInfoEstadisticasProblema from "../componentes/TarjetaInformacion/tarjetaInfoEstadisticasProblema"
import TarjetaInfoVeredictos from "../componentes/TarjetaInformacion/tarjetaInfoVeredictos"
import TarjetaInfoSobreTFG from "../componentes/TarjetaInformacion/tarjetaInfoSobreTFG"
import { useEffect, useRef, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronDown } from "@fortawesome/free-solid-svg-icons/faChevronDown"
import { faLightbulb } from "@fortawesome/free-solid-svg-icons"

export default function Inicio() {

    const tarjetasRef = useRef<HTMLElement>(null);
    const topRef = useRef<HTMLElement>(null)
    const [topVisible, setTopVisible] = useState(true)


    const irATarjetas = () => {
        tarjetasRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setTopVisible(entry.isIntersecting),
            { threshold: 0.1 }
        )
        if (topRef.current) observer.observe(topRef.current)
        return () => observer.disconnect()
    }, [])

    return (
        <div style={{ height: "100vh" }}>
            <section
                ref={topRef}
                style={{ minHeight: "100vh" }}
                className="d-flex flex-column justify-content-center align-items-center text-center px-4 position-relative"
            >
                <div className="mb-3 d-flex align-items-center gap-2" style={{ color: "#446E9B", marginLeft: "-4rem" }}>
                    <FontAwesomeIcon icon={faLightbulb} style={{ fontSize: "3rem" }} />
                    <div style={{ lineHeight: 1.25 }}>
                        <div style={{ fontWeight: 700, fontSize: "2.5rem" }}>¡Acepta el reto!</div>
                        <div style={{ fontWeight: 400, fontSize: "1rem", color: "#72ACD3", letterSpacing: "0.05em", textAlign: "center" }}>
                            Estadísticas y Logros
                        </div>
                    </div>
                </div>
                <p className="text-muted mb-4 w-75 mx-auto">
                    Descubre tus estadísticas y las de otros usuarios, compite en la clasificación y desbloquea
                    logros como parte de la comunidad de ¡Acepta el reto!
                </p>

                {topVisible && (
                    <button
                        onClick={irATarjetas}
                        className="d-flex flex-column align-items-center gap-1 border-0 bg-transparent 
                            hover:scale-[1.1] duration-200"
                        style={{ position: "absolute", bottom: "2rem", cursor: "pointer", color: "#446E9B", opacity: 0.7 }}
                    >
                        Descubrir sobre la plataforma
                        <FontAwesomeIcon icon={faChevronDown} />
                    </button>
                )}
            </section>

            {/* seccion tarjetas */}
            <section
                ref={tarjetasRef}
                style={{ minHeight: "100vh" }}
                className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"
            >
                <div className="text-center mb-8">
                    <h2 style={{ fontWeight: 700, color: "#446E9B", fontSize: "1.4rem", marginBottom: "0.3rem" }}>
                        ¿Qué puedes encontrar?
                    </h2>
                    <p className="text-muted" style={{ fontSize: "0.875rem" }}>
                        Explora todas las secciones de la plataforma
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-4">
                    <TarjetaInfoXpYNivel />
                    <TarjetaInfoLogros />
                    <TarjetaInfoEstadisticasUsuario />
                    <TarjetaInfoEstadisticasProblema />
                    <TarjetaInfoVeredictos />
                    <TarjetaInfoSobreTFG />
                </div>
            </section>
        </div>
    )
}