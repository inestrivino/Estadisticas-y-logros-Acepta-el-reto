import { Link } from "react-router-dom"
import PruebaSocketComponent from "../componentes/pruebaSocket"
import PanelParticipacion from "../componentes/panelParticipacion"

export default function PruebaSocket() {
    return (
        <div>
            <p>Panel de pruebas</p>
            <PruebaSocketComponent />
            <Link to="/problemas/problema1">Get</Link>

            <p>Panel de participacion</p>
            <PanelParticipacion />
        </div>
    )
}