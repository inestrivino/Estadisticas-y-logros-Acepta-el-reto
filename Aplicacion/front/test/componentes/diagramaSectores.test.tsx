import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { setupServer } from "msw/node";
import { describe, expect, beforeAll, afterEach, afterAll, test, vi, beforeEach } from "vitest";

import DiagramaSectores from "../../src/componentes/DiagramaSectores/diagramaSectores.tsx";
import { EventType, formatEvent } from "shared";
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

describe("DiagramaSectores", () => {
    test("Renderiza correctamente con datos", async () => {

        //Se renderiza el componente con datos de ejemplo
        render(
            <MemoryRouter>
                <DiagramaSectores
                    evento={formatEvent("problema1", EventType.PROBLEMA_LENGUAJES)}
                    dimensiones={{ width: 350, height: 350, outerRadius: 75 }}
                    colores={[
                        "#7947CF", "#35D0BC", "#DF9350", "#4F8EF7",
                        "#E84C88", "#6BCF63", "#4c5df2", "#b351e0",
                        "#EB5757", "#56CCF2", "#2F80ED",
                    ]}
                    datos={[
                        { name: "cpp", value: 25 },
                        { name: "c", value: 15 },
                        { name: "java", value: 2 }
                    ]}
                />
            </MemoryRouter>
        );

        //Se ve si ha cargado correctamente
        await waitFor(() => {
            expect(screen.getByText("cpp")).toBeInTheDocument();
            expect(screen.getByText("c")).toBeInTheDocument();
            expect(screen.getByText("java")).toBeInTheDocument();
        });
    });

    test("Carga nuevos datos que llegan por el socket", async () => {

        //Se renderiza el componente con datos de ejemplo
        render(
            <MemoryRouter>
                <DiagramaSectores
                    evento={formatEvent("problema1", EventType.PROBLEMA_LENGUAJES)}
                    dimensiones={{ width: 350, height: 350, outerRadius: 75 }}
                    colores={[
                        "#7947CF", "#35D0BC", "#DF9350", "#4F8EF7",
                        "#E84C88", "#6BCF63", "#4c5df2", "#b351e0",
                        "#EB5757", "#56CCF2", "#2F80ED",
                    ]}
                    datos={[
                        { name: "cpp", value: 25 },
                        { name: "c", value: 15 },
                        { name: "java", value: 2 }
                    ]}
                />
            </MemoryRouter>
        );

        //Se espera a que cargue el componente
        await waitFor(() => screen.getAllByText("cpp").length);

        const handler = (socket.on as any).mock.calls[0][1];

        //Se simula un nuevo envio que llega por el socket
        handler([
            { name: "cpp", value: 99 },
            { name: "c", value: 1 },
            { name: "java", value: 50 }
        ]);

        await waitFor(() => {
            expect(screen.getByText("99")).toBeInTheDocument();
            expect(screen.getByText("1")).toBeInTheDocument();
            expect(screen.getByText("50")).toBeInTheDocument();
        });
    });
});