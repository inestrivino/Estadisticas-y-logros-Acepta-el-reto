import { useSearchParams } from "react-router-dom";
import { useCallback, useEffect } from "react";

export function useQueryState(key: string, defaultValue: string) {
    const [searchParams, setSearchParams] = useSearchParams();
    const storageKey = key;

    // pone valor de url del parametro, si no existe pone el guardado en local storage, sino hay pone el default pasado por parametro
    const value = searchParams.get(key)
        ?? localStorage.getItem(storageKey)
        ?? defaultValue;

    // si vino de URL, sincroniza localStorage
    useEffect(() => {
        const param = searchParams.get(key);
        if (param) {
            localStorage.setItem(storageKey, param);
        }
    }, [searchParams, key]);

    // cuando cambia alguno de los valores, vualve a actualizar la url
    const setValue = useCallback((newValue: string) => {
        localStorage.setItem(storageKey, newValue);
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set(key, newValue);
            return next;
        }, { replace: true });
    }, [key, setSearchParams]);

    return [value, setValue] as const;
}