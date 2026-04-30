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
        <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col" style={{ minHeight: "calc(100dvh - 75px)" }}>

                {/* titulo y buscador */}
                <div className={`
                    flex flex-col items-center flex-shrink-0 w-full transition-all duration-1000 ease-in-out
                    ${hasResult ? "" : "mt-[calc(50dvh-155px)]"}
                `}>
                    <div className={`
                        transition-all duration-1000 ease-in-out text-center overflow-hidden
                        ${hasResult
                            ? "opacity-0 max-h-0 mb-0 pointer-events-none"
                            : "opacity-100 max-h-40 mb-4"
                        }
                    `}>
                        <h1 className="text-3xl font-bold">{tituloBusqueda}</h1>
                        <p className="mt-3 text-muted">{descripcion}</p>
                    </div>

                    <div className={`w-full max-w-md ${hasResult ? "mt-6" : ""}`}>
                        {buscador}
                    </div>

                    {mensajeDeNoEncontrado && (
                        <Alert variant="danger" className="mt-2">
                            {mensajeDeNoEncontrado}
                        </Alert>
                    )}

                    {hasResult && (
                        <h1 className="mt-4 w-full text-left">{tituloResultado}</h1>
                    )}
                </div>

                {/* componente de informacion despues de la busqueda */}
                <div className={`
                    transition-all duration-1000 ease-in-out
                    ${hasResult
                        ? "opacity-100 translate-y-0 mt-2"
                        : "opacity-0 translate-y-12 pointer-events-none h-0 overflow-hidden"
                    }
                `}>
                    {children}
                </div>

            </div>
        </div>
    );
}
