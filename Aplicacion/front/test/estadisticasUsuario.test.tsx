import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, expect, beforeAll, afterEach, afterAll, vi, test, beforeEach } from "vitest";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";

import EstadisticasUsuario from "../src/pages/EstadisticasUsuario"

//HANDLERS PARA LOS ENDPOINTS
const handlers = [
    http.get("/api/usuarios", () =>
        HttpResponse.json([])
    ),
    http.get("/api/usuarios/:usuario", () =>
        HttpResponse.json({ existe: true })
    ),
    http.get("/api/usuarios/:usuario/nivel", () =>
        HttpResponse.json("SIN_NIVEL")
    ),
    http.get("/api/usuarios/:usuario/enviosAnio", () =>
        HttpResponse.json([])
    ),
    http.get("/api/usuarios/:usuario/xpPorMes", () =>
        HttpResponse.json([])
    ),
    http.get("/api/usuarios/:usuario/resultados", () =>
        HttpResponse.json([{ name: "AC", value: 30 }, { name: "WA", value: 10 }])
    ),
    http.get("/api/usuarios/:usuario/logrosRecientes", () =>
        HttpResponse.json([])
    ),
    http.get("/api/usuarios/:usuario/lenguajes", () =>
        HttpResponse.json([{ name: "cpp", value: 25 }])
    ),
    http.get("/api/usuarios/:usuario/posRanking", () =>
        HttpResponse.json(1)
    ),
    http.get("/api/usuarios/:usuario/numEjerciciosResueltos", () =>
        HttpResponse.json(42)
    ),
    http.get("/api/usuarios/:usuario/rachaActualEnvios", () =>
        HttpResponse.json(5)
    ),
    http.get("/api/usuarios/:usuario/rachaMaxEnvios", () =>
        HttpResponse.json(10)
    ),
    http.get("/api/usuarios/:usuario/rachaActualDias", () =>
        HttpResponse.json(3)
    ),
    http.get("/api/usuarios/:usuario/rachaMaxDias", () =>
        HttpResponse.json(7)
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
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.setItem("usuario", "user1");
});
afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
});
afterAll(() => server.close());

function renderWithRouter() {
    return render(
        <NuqsAdapter>
            <MemoryRouter initialEntries={["/usuarios/estadisticas?usuario=user1"]}>
                <Routes>
                    <Route path="/usuarios/estadisticas" element={<EstadisticasUsuario />} />
                </Routes>
            </MemoryRouter>
        </NuqsAdapter>
    );
}

describe("La pagina carga correctamente", () => {
    test("Cargan los componentes de la pagina", async () => {
        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText("Tabla de clasificación")).toBeInTheDocument();
            expect(screen.getByText("Ejercicios resueltos")).toBeInTheDocument();
            expect(screen.getByText("Racha envíos aceptados")).toBeInTheDocument();
            expect(screen.getByText("Racha de días")).toBeInTheDocument();
        });
    });
});
