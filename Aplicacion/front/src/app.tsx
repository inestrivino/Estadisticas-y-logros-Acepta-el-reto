import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home.tsx"
import Prueba from "./pages/Prueba.tsx"
import PruebaSocket from "./pages/PruebaSocket.tsx"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/prueba" element={<Prueba />} />
        <Route path="/pruebaSocket" element={<PruebaSocket />} />
      </Routes>
    </BrowserRouter>
  )
}