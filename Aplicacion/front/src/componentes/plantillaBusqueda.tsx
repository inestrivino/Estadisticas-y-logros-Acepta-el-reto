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
        <div className="w-full px-4 sm:px-6 lg:px-8 mt-4">

            <div className={
                `transition-all duration-700 ease-in-out flex flex-col items-center
                ${hasResult ? "justify-start pt-4" : "justify-center min-h-[80vh]"}
            `}>

                {!hasResult && <div className={`text-center transition-all duration-700 ${hasResult ? "mb-6" : "mb-4"}`}>
                    <h1 className="text-3xl font-bold">
                        {tituloBusqueda}
                    </h1>

                    <p className="mt-3 text-muted">
                        {descripcion}
                    </p>

                </div>}

                <div className={`w-full max-w-md transition-all duration-700`}>
                    {buscador}
                </div>

                {hasResult && <h1 className="mt-4 w-full text-left">{tituloResultado}</h1>}

                <div className={`
                    w-full mt-8 transition-all duration-700 ease-in-out
                    ${hasResult ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none h-0 overflow-hidden"}
                `}>
                    {children}
                </div>
                

            </div>
        </div>
    );
}