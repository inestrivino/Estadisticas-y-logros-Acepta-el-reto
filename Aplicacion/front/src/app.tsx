import { BrowserRouter, Routes, Route } from "react-router-dom"
import EstadisticasProblema from "./pages/EstadisticasProblema.tsx"
import PruebaSocket from "./pages/PruebaSocket.tsx"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PruebaSocket />} />
        <Route path="/problemas/:problema" element={<EstadisticasProblema />} />
        <Route path="/pruebaSocket" element={<PruebaSocket />} />
      </Routes>
    </BrowserRouter>
  )
}