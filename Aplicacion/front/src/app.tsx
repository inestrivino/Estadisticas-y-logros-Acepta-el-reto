import { BrowserRouter, Routes, Route } from "react-router-dom"
import PruebaSocket from "./pages/PruebaSocket"
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
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Inicio />} />
            <Route path="/problemas" element={<EstadisticasProblema />} />
            <Route path="/problemas/:problema" element={<EstadisticasProblema />} />
            <Route path="/pruebaSocket" element={<PruebaSocket />} />
            <Route path="/usuarios/estadisticas" element={<EstadisticasUsuario />} />
            <Route path="/usuarios/estadisticas/:usuario" element={<EstadisticasUsuario />} />
            <Route path="/usuarios/logros/" element={<LogrosUsuario />} />
            <Route path="/usuarios/logros/:usuario" element={<LogrosUsuario />} />
            <Route path="/usuarios/ranking" element={<TablaDeClasificacion usuario="user1" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>

  )
}