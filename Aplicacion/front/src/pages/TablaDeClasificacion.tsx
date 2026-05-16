import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { socket } from "../services/socket.ts";
import { EventType } from "shared";
import { useQueryState } from "../hooks/useQueryState.tsx";
import { NivelUsuario } from "shared/NivelUsuarios.ts";
import "./TablaDeClasificaion.css";

import BuscadorRanking from "../componentes/Ranking/BuscadorRanking.tsx";
import FiltrosNivel from "../componentes/Ranking/FiltrosNivel.tsx";
import TablaRanking from "../componentes/Ranking/TablaRanking.tsx";
import Paginacion from "../componentes/Ranking/Paginacion.tsx";
import { datoUsuario, pagSize } from "../componentes/Ranking/utils.ts";

export default function TablaDeClasificacion() {

    const [users, setUsers] = useState<datoUsuario[]>([]);
    const [totalPags, setTotalPags] = useState(1);
    const [loading, setLoading] = useState(false);

    const [usuarioQuery, setUsuarioQuery] = useQueryState("usuarioActual", "");
    const usuario = usuarioQuery;
    const [usuarioExiste, setUsuarioExiste] = useState<boolean | null>(null);

    const [pagStr, setPagStr] = useQueryState("pagina", "1");
    const pag = parseInt(pagStr) || 1;
    const setPag = (val: number) => setPagStr(String(val));

    const [nivelFiltro] = useQueryState("nivel", "");

    const [, setSearchParams] = useSearchParams();

    const [nivelUsuario, setNivelUsuario] = useState<NivelUsuario>(NivelUsuario.SIN_NIVEL);

    /**
     * Pide al backend el bloque de usuarios correspondiente a la pagina y nivel indicados, y actualiza el estado.
     * @param paginaActual - Numero de pagina a cargar.
     * @param nivel - Nivel por el que filtrar, o cadena vacia para no filtrar.
     */
    const fetchRanking = async (paginaActual: number, nivel: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ pag: String(paginaActual), tam: String(pagSize) });
            if (nivel) params.set("nivel", nivel);
            const res = await fetch(`/api/usuarios/ranking?${params.toString()}`);
            const data = await res.json();
            setUsers(data.usuarios);
            setTotalPags(Math.max(1, Math.ceil(data.totalUsuarios / pagSize)));
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRanking(pag, nivelFiltro);
    }, [pag, nivelFiltro]);

    useEffect(() => {
        if (!usuario) {
            setUsuarioExiste(false);
            setNivelUsuario(NivelUsuario.SIN_NIVEL);
            return;
        }
        fetch(`/api/usuarios/${usuario}`)
            .then(res => res.json())
            .then(data => {
                if (!data.existe) {
                    setUsuarioExiste(false);
                    setUsuarioQuery("");
                    localStorage.removeItem("usuarioActual");
                    setSearchParams(prev => {
                        const next = new URLSearchParams(prev);
                        next.delete("usuarioActual");
                        return next;
                    }, { replace: true });
                } else {
                    setUsuarioExiste(true);
                    fetch(`/api/usuarios/${usuario}/nivel`)
                        .then(r => r.json())
                        .then(n => setNivelUsuario(n));
                }
            });
    }, [usuario]);

    useEffect(() => {
        const handler = () => fetchRanking(pag, nivelFiltro);
        socket.on(EventType.ACTUALIZACION_RANKING, handler);
        return () => { socket.off(EventType.ACTUALIZACION_RANKING, handler); };
    }, [pag, nivelFiltro]);

    /**
     * Cambia el filtro de nivel y vuelve a la primera pagina en una sola actualizacion de URL.
     * @param nuevoNivel - Nuevo valor de nivel ("" para "Todos").
     */
    const cambiarNivel = (nuevoNivel: string) => {
        localStorage.setItem("nivel", nuevoNivel);
        localStorage.setItem("pagina", "1");
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set("nivel", nuevoNivel);
            next.set("pagina", "1");
            return next;
        }, { replace: true });
    };

    /**
     * Tras validar al usuario en el buscador, salta a la pagina donde aparece dentro del filtro actual.
     * Si no pertenece al filtro, se queda en la pagina actual pero registra al usuario destacado.
     * @param valor - Nombre del usuario buscado.
     */
    const irAUsuario = async (valor: string) => {
        const normalizado = valor.toLowerCase().normalize("NFC").trim();
        try {
            const filtrar = !!nivelFiltro;
            const res = await fetch(`/api/usuarios/ranking/${normalizado}?filtrarNivel=${filtrar}`);
            const info = await res.json();
            //si hay filtro y el usuario no es de ese nivel, no saltamos de pagina (no aparece en la lista filtrada)
            const matchesFiltro = !nivelFiltro || info?.nivel === nivelFiltro;
            const paginaDestino = info?.pos > 0 && matchesFiltro ? Math.ceil(info.pos / pagSize) : pag;
            localStorage.setItem("usuarioActual", normalizado);
            localStorage.setItem("pagina", String(paginaDestino));
            setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.set("usuarioActual", normalizado);
                next.set("pagina", String(paginaDestino));
                return next;
            }, { replace: true });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 pb-4">
            <div className="max-w-6xl mx-auto mt-3">

                <BuscadorRanking
                    usuario={usuario}
                    nivelUsuario={nivelUsuario}
                    onResultado={irAUsuario}
                />

                <FiltrosNivel
                    nivelActual={nivelFiltro}
                    onCambio={cambiarNivel}
                    usuario={usuarioExiste ? usuario : ""}
                    nivelUsuario={nivelUsuario}
                />

                <TablaRanking
                    users={users}
                    loading={loading}
                    usuarioDestacado={usuarioExiste ? usuario : ""}
                />

                <Paginacion
                    pag={pag}
                    totalPags={totalPags}
                    setPag={setPag}
                    usuario={usuarioExiste ? usuario : ""}
                    onIrAUsuario={() => irAUsuario(usuario)}
                />

            </div>
        </div>
    );
}
