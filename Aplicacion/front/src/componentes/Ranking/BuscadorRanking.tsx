import { EventType, formatEvent } from "shared";
import { NivelUsuario } from "shared";
import Buscador from "../Buscador/buscador.tsx";
import EtiquetaNivel from "../EtiquetaNivel/etiquetaNivel.tsx";

/**
 * Buscador del ranking de usuarios. Cuando se busca un usuario, llama a `onResultado`
 * con el nombre validado. Si hay un usuario actual, muestra su nombre y nivel como prefijo.
 */
export default function BuscadorRanking(props: {
    usuario: string,
    nivelUsuario: NivelUsuario,
    onResultado: (valor: string) => void,
}) {
    const { usuario, nivelUsuario, onResultado } = props;

    return (
        <div className="justify-center">
            <Buscador
                tipo="usuario_estadistica"
                ruta=""
                valorInicial={usuario}
                onResultado={onResultado}
                //si hay usuario, se muestra como titulo del buscador junto a su etiqueta de nivel
                prefijo={usuario
                    ? <>
                        <span className="text-truncate min-w-0">
                            Posición de <b className="ms-1">{usuario}</b>
                        </span>
                        {nivelUsuario &&
                            <EtiquetaNivel
                                evento={formatEvent(usuario, EventType.USUARIO_NIVEL)}
                                nivel={nivelUsuario}
                                className="flex-shrink-0"
                            />
                        }
                    </>
                    : undefined
                }
            />
        </div>
    );
}
