import { BrowserRouter, Routes, Route } from "react-router-dom"
import EstadisticasProblema from "./pages/EstadisticasProblema.tsx"
import PruebaSocket from "./pages/PruebaSocket.tsx"
import Layout from "./pages/Layout/Layout.tsx"
import LogrosUsuario from "./pages/LogrosUsuario/LogrosUsuario.tsx"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<PruebaSocket />} />
          <Route path="/problemas/:problema" element={<EstadisticasProblema />} />
          <Route path="/pruebaSocket" element={<PruebaSocket />} />
          <Route path="/usuarios/:usuario/estadisticas" element={<PruebaSocket />} />
          <Route path="/usuarios/:usuario/logros" element={<LogrosUsuario />} />
          <Route path="/usuarios/ranking" element={<PruebaSocket />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}