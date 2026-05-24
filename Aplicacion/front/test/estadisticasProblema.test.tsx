import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, expect, beforeAll, afterEach, afterAll, vi, test, beforeEach } from "vitest";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";

import EstadisticasProblema from "../src/pages/EstadisticasProblema"

//HANDLERS PARA LOS ENDPOINTS
export const handlers = [
  http.get("/api/problemas", () =>
    HttpResponse.json([])
  ),
  http.get("/api/problemas/:problema", () =>
    HttpResponse.json({ existe: true })
  ),
  http.get("/api/problemas/:problema/envios", () =>
    HttpResponse.json(100000)
  ),
  http.get("/api/problemas/:problema/mejorTiempo", () =>
    HttpResponse.json(0.001)
  ),
  http.get("/api/problemas/:problema/tiempoPromedio", () =>
    HttpResponse.json(1.001)
  ),
  http.get("/api/problemas/:problema/resultados", () =>
    HttpResponse.json([
      { name: "AC", value: 30 },
      { name: "WA", value: 10 },
      { name: "TLE", value: 2 },
    ])
  ),
  http.get("/api/problemas/:problema/lenguajes", () =>
    HttpResponse.json([
      { name: "cpp", value: 25 },
      { name: "c", value: 15 },
      { name: "java", value: 2 },
    ])
  ),
];

//MOCKS DE COMPONENTES
vi.mock("../src/services/socket", () => ({
  socket: {
    on: vi.fn(),
    off: vi.fn(),
  },
}));

//SETUP
const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
beforeEach(() => { cleanup(); });
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderWithRouter() {
  window.history.pushState(
    {},
    "",
    "/problemas?problema=problema1"
  );

  return render(
    <NuqsAdapter>
      <MemoryRouter initialEntries={["/problemas?problema=problema1"]}>
        <Routes>
          <Route
            path="/problemas"
            element={<EstadisticasProblema />}
          />
        </Routes>
      </MemoryRouter>
    </NuqsAdapter>
  );
}

describe("La pagina carga correctamente", () => {
  test("Cargan los componentes de la pagina", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("Envios")).toBeInTheDocument();
      expect(screen.getByText("Mejor tiempo")).toBeInTheDocument();
      expect(screen.getByText("Tiempo Promedio")).toBeInTheDocument();
    });
  });
});