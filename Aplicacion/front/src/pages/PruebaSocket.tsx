import { Link } from "react-router-dom"
import PruebaSocketComponent from "../componentes/pruebaSocket"

export default function PruebaSocket() {
    return (
        <div>
            <p>Panel de pruebas</p>
            <PruebaSocketComponent />
            <Link to="/home">Get</Link>
        </div>
    )
}