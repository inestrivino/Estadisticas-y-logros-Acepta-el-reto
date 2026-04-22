import { BrowserRouter, Routes, Route } from "react-router-dom"
import EstadisticasProblema from "./pages/EstadisticasProblema/EstadisticasProblema.js"
import PruebaSocket from "./pages/PruebaSocket"
import Layout from "./pages/Layout/Layout.js"
import EstadisticasUsuario from "./pages/EstadisticasUsuario"
import LogrosUsuario from "./pages/LogrosUsuario/LogrosUsuario"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<PruebaSocket />} />
          <Route path="/problemas/:problema" element={<EstadisticasProblema />} />
          <Route path="/pruebaSocket" element={<PruebaSocket />} />
          <Route path="/usuarios/:usuario/estadisticas" element={<EstadisticasUsuario />} />
          <Route path="/usuarios/:usuario/logros" element={<LogrosUsuario />} />
          <Route path="/usuarios/ranking" element={<PruebaSocket />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}