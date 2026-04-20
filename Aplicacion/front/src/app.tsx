import { BrowserRouter, Routes, Route } from "react-router-dom"
import PruebaSocket from "./pages/PruebaSocket"
import Layout from "./pages/Layout/Layout.js"
import LogrosUsuario from "./pages/LogrosUsuario/LogrosUsuario"
import TablaDeClasificacion from "./pages/TablaDeClasificacion.js"
import Inicio from "./pages/Inicio.js"
import Estadisticas from "./pages/Estadisticas.js"
import AppProvider from "./contexto/contextos"

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Inicio />} />
            <Route path="/problemas" element={<Estadisticas tipo="problema" />} />
            <Route path="/problemas/:problema" element={<Estadisticas tipo="problema" />} />
            <Route path="/pruebaSocket" element={<PruebaSocket />} />
            <Route path="/usuarios/estadisticas" element={<Estadisticas tipo="usuario" />} />
            <Route path="/usuarios/estadisticas/:usuario" element={<Estadisticas tipo="usuario" />} />
            <Route path="/usuarios/logros/:usuario" element={<LogrosUsuario />} />
            <Route path="/usuarios/ranking" element={<TablaDeClasificacion usuario="user1" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>

  )
}