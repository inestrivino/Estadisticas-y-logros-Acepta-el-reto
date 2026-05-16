import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { setupServer } from "msw/node";
import { describe, expect, beforeAll, afterEach, afterAll, test, vi, beforeEach } from "vitest";

import DatoNumerico from "../../src/componentes/DatoNumerico/datoNumerico.tsx";
import { EventType, formatEvent } from "shared/EventTypes.ts";
import { socket } from "../../src/services/socket.ts";

//MOCKS DE COMPONENTES
vi.mock("../../src/services/socket", () => ({
    socket: {
        on: vi.fn(),
        off: vi.fn(),
    },
}));

//SETUP
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("DatoNumerico", () => {

    test("Renderiza correctamente con datos", async () => {

        //Se renderiza el componente con datos de ejemplo
        render(
            <MemoryRouter>
                <DatoNumerico
                    evento={formatEvent("problema1", EventType.TIEMPO_PROM_PROBLEMA)}
                    dimensiones={{ width: 200, height: 100 }}
                    dato={{ value: 10, description: "Tiempo Promedio" }}
                />
            </MemoryRouter>
        );

        //Se ve si ha cargado correctamente
        await waitFor(() => {
            expect(screen.getByText("Tiempo Promedio")).toBeInTheDocument();
            expect(screen.getByText("10")).toBeInTheDocument();
        });
    });

    test("Carga nuevos datos que llegan por el socket", async () => {

        //Se renderiza el componente con datos de ejemplo
        render(
            <MemoryRouter>
                <DatoNumerico
                    evento={formatEvent("problema1", EventType.TIEMPO_PROM_PROBLEMA)}
                    dimensiones={{ width: 200, height: 100 }}
                    dato={{ value: 10, description: "Tiempo Promedio" }}
                />
            </MemoryRouter>
        );

        //Se espera a que cargue el componente
        await waitFor(() => screen.getAllByText("Tiempo Promedio").length);

        const handler = (socket.on as any).mock.calls[0][1];

        //Se simula un nuevo envio que llega por el socket
        handler(13);

        await waitFor(() => {
            expect(screen.getByText("Tiempo Promedio")).toBeInTheDocument();
            expect(screen.getByText("13")).toBeInTheDocument();
        });
    });
});