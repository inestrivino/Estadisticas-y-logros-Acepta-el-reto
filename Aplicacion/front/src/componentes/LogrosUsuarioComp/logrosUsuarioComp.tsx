import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Tab, Tabs } from "react-bootstrap";
import { EventType, formatEvent } from "shared";
import { socket } from "../../services/socket.js";

import { ListadoLogros } from "shared/LogroTypes";
import { CategoriaLogro, NivelLogro } from "shared/LogroConsts";
import "./logrosUsuarioComp.css";

// COMPONENTES
import GrupoLogro from "../Logro/grupoLogros.js";
import { useQueryState } from "../../hooks/useQueryState.js";


export default function LogrosUsuarioComp(props: {
    usuario: string
}) {

    const usuario = props.usuario;

    const [key, setKey] = useQueryState("clasificacion", "nivel");

    const [logros, setLogros] = useState<ListadoLogros>();
    useEffect(() => {
        if (!usuario) return;

        fetch(`/api/usuarios/${usuario}/logros?clasificacion=${key}`)
            .then(response => response.json())
            .then(data => { setLogros(data); });
    }, [usuario, key])

    useEffect(() => {
        if (!usuario) 
            return;

        const nombreEvento = formatEvent(usuario,
            key === "nivel"
                ? EventType.LOGROS_USUARIO_NIVEL
                : EventType.LOGROS_USUARIO_CATEGORIA
        );

        const handler = (data: ListadoLogros) => {
            setLogros(data);
        };

        socket.on(nombreEvento, handler);

        return () => {
            socket.off(nombreEvento, handler);
        };
    }, [usuario, key]);

    return (
        <>
            {/*<h1 className="p-4 titulo">Logros de <b>{usuario}</b></h1>*/}
            <Container fluid="md" className="d-flex justify-content-center">
                <div className="mt-2" style={{
                    width: "100%", maxWidth: "1100px",
                    "--tab-color": getGroupColor(logros?.grupos?.[0]?.grupo || "")
                } as React.CSSProperties} >

                    <Tabs id="controlled-tab-example" activeKey={key} onSelect={(k) => setKey(k ? k : 'nivel')}
                        className="mb-3 justify-content-end app-tabs">
                        <Tab eventKey="nivel" title="Nivel"></Tab>
                        <Tab eventKey="categoria" title="Categoría"></Tab>
                    </Tabs>

                    {logros?.grupos.map((logrosGrupo, idx) => (
                        <GrupoLogro
                            key={idx}
                            dimensiones={{ width: 1100, height: 300, outerRadius: 0 }}
                            color={getGroupColor(logrosGrupo.grupo)}
                            datos={logrosGrupo}
                        />
                    ))}
                </div>
            </Container >
        </>
    )

    function getGroupColor(grupo: string) {
        let color = "black"
        switch (grupo) {
            case NivelLogro.ORO: color = "#f9c22b"; break;
            case NivelLogro.PLATA: color = "#9babb2"; break;
            case NivelLogro.BRONCE: color = "#Cd683d"; break;
            case CategoriaLogro.ONBOARDING: color = "#3c6e71"; break;
            case CategoriaLogro.PROBLEMAS: color = "#80AEAB"; break;
            case CategoriaLogro.LENGUAJES: color = "#7A99C7"; break;
            case CategoriaLogro.RACHAS: color = "#0078A7"; break;
            case CategoriaLogro.CALIDAD: color = "#848F95"; break;
            case CategoriaLogro.CATEGORIAS: color = "#d9d9d9"; break;
        }
        return color;
    }
}