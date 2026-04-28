import { createContext, ReactNode, useContext, useState } from "react";

export type AppContecxtType = {
    problemaActual: string;
    setProblemaActual: (p: string) => void;

    usuarioActual: string;
    setUsuarioActual: (u: string) => void;
}

const AppContext = createContext<AppContecxtType | undefined>(undefined);

export default function AppProvider({ children }: { children: ReactNode }) {

    const [problemaActual, setProblemaActualState] = useState(
        localStorage.getItem("problemaActual") || ""
    );

    const [usuarioActual, setUsuarioActualState] = useState(
        localStorage.getItem("usuarioActual") || ""
    );

    const setProblemaActual = (problema: string) => {
        setProblemaActualState(problema);
        localStorage.setItem("problemaActual", problema);
    }

    const setUsuarioActual = (usuario: string) => {
        setUsuarioActualState(usuario);
        localStorage.setItem("usuarioActual", usuario);
    }

    return(
        <AppContext.Provider value={{problemaActual, setProblemaActual, usuarioActual, setUsuarioActual}}>
            {children}
        </AppContext.Provider>
    )
}

export function useAppContext() {
    const context = useContext(AppContext);
    if(!context) {
        console.log("Error de contexto. El contexto se debe usar dentro del provider");
    }
    return context;
}