import { describe, test, expect } from 'vitest';
import problemaDAO from '../../src/dao/problemaDAO.js';
import { EstadoProblema } from '../../src/types/estados/estadoProblema.js';
import { CampoProblema } from '../../src/types/estados/camposEstadoProblema.js';
import setUpTestFile from './setUptTest.ts';

await setUpTestFile(problemaDAO);

const PROBLEMA = "Facundo y el undo";

function estadoBase(): EstadoProblema {
    return {
        [CampoProblema.ENVIOS]: true,
        envios: 0,
        enviosAC: 0,
        [CampoProblema.TIEMPOS]: true,
        mejorTiempo: Infinity,
        tiempoTotal: 0,
        tiemposOrdenados: [],
        posUltimoEnvio: -1,
        tiemposEnvios: new Map(),
        [CampoProblema.RESULTADOS]: true,
        resultados: new Map(),
        [CampoProblema.LENGUAJES]: true,
        lenguajes: new Map(),
    };
}

async function registrar(estado: EstadoProblema) {
    await problemaDAO.registrarEstadosProblemas(new Map([[PROBLEMA, estado]]));
}

describe("Registrar estado de un problema", () => {

    test("guarda el numero de envios", async () => {
        const estado = estadoBase();
        estado.envios = 1;
        await registrar(estado);
        expect(await problemaDAO.getNumEnvios(PROBLEMA)).toBe(1);
    });

    test("guarda el tiempo promedio de envios AC", async () => {
        const estado = estadoBase();
        estado.tiempoTotal = 0.2;
        estado.resultados!.set("AC", 1);
        estado.tiemposEnvios!.set(1, 0.2);
        await registrar(estado);
        expect(await problemaDAO.getTiempoPromedio(PROBLEMA)).toBe(0.2);
    });

    test("el tiempo promedio es 0 si no hay envios AC", async () => {
        const estado = estadoBase();
        estado.envios = 1;
        estado.resultados!.set("WA", 1);
        await registrar(estado);
        expect(await problemaDAO.getTiempoPromedio(PROBLEMA)).toBe(0);
    });

    test("guarda el mejor tiempo", async () => {
        const estado = estadoBase();
        estado.tiemposEnvios!.set(1, 0.2);
        await registrar(estado);
        expect(await problemaDAO.getMejorTiempo(PROBLEMA)).toBe(0.2);
    });

    test("guarda los resultados", async () => {
        const estado = estadoBase();
        estado.resultados!.set("AC", 1);
        estado.resultados!.set("WA", 1);
        await registrar(estado);
        const resultados = await problemaDAO.getResultados(PROBLEMA);
        expect(resultados).toContainEqual({ name: "AC", value: 1 });
        expect(resultados).toContainEqual({ name: "WA", value: 1 });
    });

    test("guarda los lenguajes", async () => {
        const estado = estadoBase();
        estado.lenguajes!.set("Cpp", 2);
        await registrar(estado);
        const lenguajes = await problemaDAO.getLenguajes(PROBLEMA);
        expect(lenguajes).toContainEqual({ name: "Cpp", value: 2 });
    });

    test("devuelve los lenguajes ordenados alfabeticamente", async () => {
        const estado = estadoBase();
        estado.lenguajes!.set("Python", 3);
        estado.lenguajes!.set("Java", 1);
        await registrar(estado);
        const lenguajes = await problemaDAO.getLenguajes(PROBLEMA);
        expect(lenguajes[0].name).toBe("Java");
        expect(lenguajes[1].name).toBe("Python");
    });

    test("guarda el numero de envios AC", async () => {
        const estado = estadoBase();
        estado.enviosAC = 3;
        await registrar(estado);
        expect(await problemaDAO.getNumEnviosAC(PROBLEMA)).toBe(3);
    });

    test("guarda el tiempo total de envios AC", async () => {
        const estado = estadoBase();
        estado.tiempoTotal = 1.5;
        await registrar(estado);
        expect(await problemaDAO.getTiempoTotal(PROBLEMA)).toBe(1.5);
    });

    test("guarda los tiempos de envio ordenados por tiempo ascendente", async () => {
        const estado = estadoBase();
        estado.tiemposEnvios!.set(1, 0.3);
        estado.tiemposEnvios!.set(2, 0.1);
        estado.tiemposEnvios!.set(3, 0.2);
        await registrar(estado);
        expect(await problemaDAO.getTiemposOrdenados(PROBLEMA)).toEqual([2, 3, 1]);
    });
});

describe("Actualizar estado de un problema", () => {

    test("sobreescribe el numero de envios", async () => {
        const estado1 = estadoBase();
        estado1.envios = 1;
        await registrar(estado1);

        const estado2 = estadoBase();
        estado2.envios = 2;
        await registrar(estado2);

        expect(await problemaDAO.getNumEnvios(PROBLEMA)).toBe(2);
    });

    test("sobreescribe el tiempo promedio", async () => {
        const estado1 = estadoBase();
        estado1.tiempoTotal = 0.2;
        estado1.resultados!.set("AC", 1);
        estado1.tiemposEnvios!.set(1, 0.2);
        await registrar(estado1);

        const estado2 = estadoBase();
        estado2.tiempoTotal = 0.6;
        estado2.resultados!.set("AC", 2);
        estado2.tiemposEnvios!.set(1, 0.2);
        estado2.tiemposEnvios!.set(2, 0.4);
        await registrar(estado2);

        expect(await problemaDAO.getTiempoPromedio(PROBLEMA)).toBe(0.3);
    });

    test("el mejor tiempo es el minimo del sorted set", async () => {
        const estado = estadoBase();
        estado.tiemposEnvios!.set(1, 0.2);
        estado.tiemposEnvios!.set(2, 0.1);
        await registrar(estado);
        expect(await problemaDAO.getMejorTiempo(PROBLEMA)).toBe(0.1);
    });
});

describe("Lecturas vacias", () => {

    test("devuelve 0 envios si no hay datos", async () => {
        expect(await problemaDAO.getNumEnvios("Otro problema")).toBe(0);
    });

    test("devuelve 0 tiempo promedio si no hay datos", async () => {
        expect(await problemaDAO.getTiempoPromedio("Otro problema")).toBe(0);
    });

    test("devuelve Infinity si no hay envios AC", async () => {
        expect(await problemaDAO.getMejorTiempo("Otro problema")).toBe(Infinity);
    });

    test("devuelve resultados vacios si no hay datos", async () => {
        expect(await problemaDAO.getResultados("Otro problema")).toEqual([]);
    });

    test("devuelve lenguajes vacios si no hay datos", async () => {
        expect(await problemaDAO.getLenguajes("Otro problema")).toEqual([]);
    });

    test("devuelve 0 envios AC si no hay datos", async () => {
        expect(await problemaDAO.getNumEnviosAC("Otro problema")).toBe(0);
    });

    test("devuelve 0 tiempo total si no hay datos", async () => {
        expect(await problemaDAO.getTiempoTotal("Otro problema")).toBe(0);
    });

    test("devuelve array vacio de tiempos ordenados si no hay datos", async () => {
        expect(await problemaDAO.getTiemposOrdenados("Otro problema")).toEqual([]);
    });
});
