import "./skeleton.css";

/**
 * Envoltorio que muestra una animacion de panel de carga (shimmer) sobre su contenedor
 * mientras `loading` es true. Cuando deja de cargar, renderiza sus children dentro del
 * mismo contenedor para que el aspecto visual (borde, fondo, dimensiones) se mantenga
 * identico entre los dos estados.
 * @param loading - Si true, muestra el shimmer en vez de los children.
 * @param className - Clases CSS aplicadas al contenedor (tipicamente las del componente padre).
 * @param style - Estilos inline del contenedor (ancho/alto, etc).
 * @param children - Contenido a mostrar cuando no esta cargando.
 */
export default function Skeleton(props: {
    loading?: boolean,
    className?: string,
    style?: React.CSSProperties,
    children: React.ReactNode,
}) {
    if (props.loading) {
        return (
            <div className={`${props.className ?? ""} skeleton-wrapper`} style={props.style}>
                <div className="skeleton" />
            </div>
        );
    }
    return (
        <div className={props.className} style={props.style}>
            {props.children}
        </div>
    );
}
