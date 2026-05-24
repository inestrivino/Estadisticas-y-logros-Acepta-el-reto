import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { socket } from "../services/socket.ts";
import { EventType } from "shared";
import { useQueryState } from "../hooks/useQueryState.tsx";
import { NivelUsuario } from "shared";

import BuscadorRanking from "../componentes/Ranking/BuscadorRanking.tsx";
import FiltrosNivel from "../componentes/Ranking/FiltrosNivel.tsx";
import TablaRanking from "../componentes/Ranking/TablaRanking.tsx";
import Paginacion from "../componentes/Ranking/Paginacion.tsx";
import { datoUsuario, pagSize } from "../componentes/Ranking/utils.ts";

export default function TablaDeClasificacion() {

    //datos de la pagina actual del ranking
    const [users, setUsers] = useState<datoUsuario[]>([]);
    const [totalPags, setTotalPags] = useState(1);
    const [loading, setLoading] = useState(false);
    const [tickSocket, setTickSocket] = useState(0);

    //usuario destacado, solo cambia en commits (URL inicial o irAUsuario), no en cada tecla
    const [usuario, setUsuario] = useState<string>(() =>
        new URLSearchParams(window.location.search).get("usuario") || ""
    );
    const [usuarioExiste, setUsuarioExiste] = useState<boolean | null>(null);

    //pagina actual sincronizada con la URL
    const [pagStr, setPagStr] = useQueryState("pagina", "1");
    const pag = parseInt(pagStr) || 1;
    const setPag = (val: number) => setPagStr(String(val));

    //nivel seleccionado como filtro, cadena vacia significa "todos"
    const [nivelFiltro] = useQueryState("nivel", "");

    //escritura directa de la URL para cambios que afectan a varios params a la vez
    const [, setSearchParams] = useSearchParams();

    //nivel del usuario destacado, para los chips de filtro y el aviso de paginacion
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
    }, [pag, nivelFiltro, tickSocket]);

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
                    setUsuario("");
                } else {
                    setUsuarioExiste(true);
                    fetch(`/api/usuarios/${usuario}/nivel`)
                        .then(r => r.json())
                        .then(n => setNivelUsuario(n));
                }
            });
    }, [usuario]);

    useEffect(() => {
        const handler = () => {
            //incrementa el tick para que el effect principal relance fetchRanking con el pag actual
            setTickSocket(n => n + 1);
            if (usuario) {
                fetch(`/api/usuarios/${usuario}/nivel`)
                    .then(r => r.json())
                    .then(n => setNivelUsuario(n))
                    .catch(err => console.error(err));
            }
        };
        socket.on(EventType.ACTUALIZACION_RANKING, handler);
        return () => { socket.off(EventType.ACTUALIZACION_RANKING, handler); };
    }, [usuario]);

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
            localStorage.setItem("usuario", normalizado);
            localStorage.setItem("pagina", String(paginaDestino));
            setUsuario(normalizado);
            setPagStr(String(paginaDestino));
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
                    onMarcarUsuario={irAUsuario}
                />

                <Paginacion
                    pag={pag}
                    totalPags={totalPags}
                    setPag={setPag}
                    usuario={usuarioExiste ? usuario : ""}
                    onIrAUsuario={() => irAUsuario(usuario)}
                    fueraDeFiltro={!!nivelFiltro && usuarioExiste === true && nivelUsuario !== NivelUsuario.SIN_NIVEL && nivelUsuario !== nivelFiltro}
                    nivelFiltro={nivelFiltro}
                />

            </div>
        </div>
    );
}
