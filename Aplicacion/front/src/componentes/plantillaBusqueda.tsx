import { Alert } from "react-bootstrap";
import { useEffect, useState } from "react";

type Props = {
    hasResult: boolean;
    mensajeDeNoEncontrado: string;
    tituloBusqueda: string;
    descripcion: string;
    buscador: React.ReactNode;
    children?: React.ReactNode;
};

export default function PlantillaBusqueda({
    hasResult,
    mensajeDeNoEncontrado,
    tituloBusqueda,
    descripcion,
    buscador,
    children
}: Props) {

    //se monta el contenido pesado (graficas) solo despues de que termine la animacion del buscador
    //evita que la animacion compita con el primer render de los componentes hijos
    const [mostrarContenido, setMostrarContenido] = useState(hasResult);
    useEffect(() => {
        if (hasResult) {
            const t = setTimeout(() => setMostrarContenido(true), 450);
            return () => clearTimeout(t);
        }
        setMostrarContenido(false);
    }, [hasResult]);

    return (
        <div className="w-full h-full px-4 sm:px-6 lg:px-8 pb-3 flex flex-col">

            {/* titulo + buscador, comentario: se anima con translateY en vez de margin para que sea mas fluido */}
            <div
                className="flex flex-col items-center flex-shrink-0 w-full mt-1"
                style={{
                    transform: hasResult ? "translateY(0)" : "translateY(calc(50dvh - 155px - 4px))",
                    transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
                    willChange: "transform",
                    zIndex: 1,
                }}
            >
                {/* titulo y descripcion desaparecen si hay resultado */}
                <div
                    className="text-center overflow-hidden"
                    style={{
                        opacity: hasResult ? 0 : 1,
                        maxHeight: hasResult ? 0 : "10rem",
                        marginBottom: hasResult ? 0 : undefined,
                        pointerEvents: hasResult ? "none" : "auto",
                        transition: "opacity 300ms ease-out, max-height 500ms ease-out",
                    }}
                >
                    <h1 className="text-3xl font-bold">{tituloBusqueda}</h1>
                    <p className="mt-3 text-muted">{descripcion}</p>
                </div>

                {/* buscador */}
                <div className="w-full flex justify-center">
                    <div className="w-full min-w-0">
                        {buscador}
                    </div>
                </div>

                {mensajeDeNoEncontrado && (
                    <Alert variant="danger" className="mt-2">
                        {mensajeDeNoEncontrado}
                    </Alert>
                )}
            </div>

            {/* contenido: se monta tras la animacion del buscador y entra con un fade simple */}
            <div
                className="mt-4 flex-1 min-h-0"
                style={{
                    opacity: mostrarContenido ? 1 : 0,
                    transform: mostrarContenido ? "translateY(0)" : "translateY(20px)",
                    transition: "opacity 400ms ease-out, transform 400ms ease-out",
                    pointerEvents: mostrarContenido ? "auto" : "none",
                    willChange: "opacity, transform",
                }}
            >
                {mostrarContenido && children}
            </div>

        </div>
    );
}
