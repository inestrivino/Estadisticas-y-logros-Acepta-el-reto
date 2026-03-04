import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home.tsx"
import PruebaSocket from "./pages/PruebaSocket.tsx"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PruebaSocket />} />
        <Route path="/problemas/:problema" element={<Home />} />
        <Route path="/pruebaSocket" element={<PruebaSocket />} />
      </Routes>
    </BrowserRouter>
  )
}