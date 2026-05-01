import { Alert } from "react-bootstrap";

type Props = {
    hasResult: boolean;
    mensajeDeNoEncontrado: string;
    tituloBusqueda: string;
    descripcion: string;
    tituloResultado?: React.ReactNode;
    buscador: React.ReactNode;
    children?: React.ReactNode;
};

export default function PlantillaBusqueda({
    hasResult,
    mensajeDeNoEncontrado,
    tituloBusqueda,
    descripcion,
    tituloResultado,
    buscador,
    children
}: Props) {
    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 pb-3">
            <div className="flex flex-col" style={{ minHeight: "calc(100dvh - 75px)" }}>

                {/* titulo, descripcion y buscador */}
                <div className={`
                    flex flex-col items-center flex-shrink-0 w-full
                    transition-all duration-700 ease-in-out
                    ${hasResult ? "mt-4" : "mt-[calc(50dvh-155px)]"}
                `}>

                    {/* titulo y descripcion desaparecen si hay resultado */}
                    <div className={`
                        text-center overflow-hidden
                        transition-all duration-700 ease-in-out
                        ${hasResult
                            ? "opacity-0 max-h-0 mb-0 pointer-events-none"
                            : "opacity-100 max-h-40 mb-4"}
                    `}>
                        <h1 className="text-3xl font-bold">{tituloBusqueda}</h1>
                        <p className="mt-3 text-muted">{descripcion}</p>
                    </div>

                    {/* buscador se coloca arriba o en el centro dependiento de si hay resultado o no */}
                    <div className={`
                        transition-all duration-700 ease-in-out flex items-center gap-4
                        ${hasResult ? "w-full" : "w-full max-w-md"}
                    `}>
                        {hasResult && (
                            <h1 className="text-2xl font-bold shrink-0" style={{ color: "#3a3a3a" }}>
                                {tituloResultado}
                            </h1>
                        )}
                        <div className="flex-1">
                            {buscador}
                        </div>
                    </div>

                    {mensajeDeNoEncontrado && (
                        <Alert variant="danger" className="mt-2 w-full">
                            {mensajeDeNoEncontrado}
                        </Alert>
                    )}
                </div>

                {/* los componentes con la informacion aparecen de abajo hacia arriba */}
                <div className={`
                    transition-all duration-700 ease-in-out mt-4
                    ${hasResult
                        ? "opacity-100 translate-y-0 flex-1 min-h-0"
                        : "opacity-0 translate-y-12 pointer-events-none h-0 overflow-hidden"}
                `}>
                    {children}
                </div>

            </div>
        </div>
    );
}