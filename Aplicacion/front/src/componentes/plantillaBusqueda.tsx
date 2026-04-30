type Props = {
    hasResult: boolean;
    tituloBusqueda: string;
    descripcion: string;
    tituloResultado?: React.ReactNode;
    buscador: React.ReactNode;
    children?: React.ReactNode;
};

export default function PlantillaBusqueda({
    hasResult,
    tituloBusqueda,
    descripcion,
    tituloResultado,
    buscador,
    children
}: Props) {
    return (
        <div className="w-full h-full px-4 sm:px-6 lg:px-8 pt-1 pb-3">

            <div className={
                `transition-all duration-700 ease-in-out flex flex-col items-center
                ${hasResult ? "justify-start pt-4 h-full" : "justify-center min-h-[80vh]"}
            `}>

                {!hasResult && <div className={`text-center transition-all duration-700 ${hasResult ? "mb-6" : "mb-4"}`}>
                    <h1 className="text-3xl font-bold">
                        {tituloBusqueda}
                    </h1>

                    <p className="mt-3 text-muted">
                        {descripcion}
                    </p>

                </div>}

                {hasResult ? (
                    <div className="w-full flex items-center gap-4 mt-2 shrink-0">
                        <h1 className="text-2xl font-bold shrink-0" style={{ color: "#3a3a3a" }}>{tituloResultado}</h1>
                        <div className="flex-1">{buscador}</div>
                    </div>
                ) : (
                    <div className="w-full max-w-md transition-all duration-700">
                        {buscador}
                    </div>
                )}

                <div className={`
                    w-full mt-4 transition-all duration-700 ease-in-out
                    ${hasResult ? "opacity-100 translate-y-0 flex-1 min-h-0" : "opacity-0 translate-y-8 pointer-events-none h-0 overflow-hidden"}
                `}>
                    {children}
                </div>
                

            </div>
        </div>
    );
}