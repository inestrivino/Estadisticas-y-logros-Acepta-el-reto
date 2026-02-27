import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import Diagrama from "../componentes/diagrama"
//import { EventType } from "@/server/sockets/socketEventTypes.ts";


export default function Prueba() {
    const [datos, setDatos] = useState<{ name: string; value: number }[]>();
    
    useEffect(() => {
        fetch("/api/problemas")
            .then((res) => res.json())
            .then((data) => setDatos(data))
    }, [])

    return (
        <div>
            <p>Diagrama de prueba</p>
            {datos && <Diagrama
                evento={"reload-resultadosProblemas"} //TODO falta esto aqui <==================
                dimensiones={{ width: 400, height: 400, outerRadius: 75 }}
                colores={[
                    "#7947CF", "#35D0BC", "#DF9350", "#4F8EF7",
                    "#E84C88", "#6BCF63", "#F2C94C", "#b351e0",
                    "#EB5757", "#56CCF2", "#2F80ED",
                ]}
                datos={datos}
            />}
            <Link to="/PruebaSocket">Get</Link>
        </div>
    )
}