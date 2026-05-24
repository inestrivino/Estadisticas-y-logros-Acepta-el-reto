import { BrowserRouter, Routes, Route } from "react-router-dom"
import { NuqsAdapter } from "nuqs/adapters/react-router/v7"
import Layout from "./pages/Layout/Layout.js"
import LogrosUsuario from "./pages/LogrosUsuario"
import TablaDeClasificacion from "./pages/TablaDeClasificacion.js"
import Inicio from "./pages/Inicio.js"
import AppProvider from "./contexto/contextos"
import EstadisticasProblema from "./pages/EstadisticasProblema"
import EstadisticasUsuario from "./pages/EstadisticasUsuario"

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <NuqsAdapter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Inicio />} />
              <Route path="/problemas" element={<EstadisticasProblema />} />
              <Route path="/usuarios/estadisticas" element={<EstadisticasUsuario />} />
              <Route path="/usuarios/logros" element={<LogrosUsuario />} />
              <Route path="/usuarios/ranking" element={<TablaDeClasificacion />} />
            </Route>
          </Routes>
        </NuqsAdapter>
      </BrowserRouter>
    </AppProvider>

  )
}