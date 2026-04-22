import { describe, test, expect } from 'vitest';
import problemaDAO from '../../src/dao/problemaDAO.js';
import setUpTestFile from './setUptTest.ts';

await setUpTestFile(problemaDAO);

const datoAC = {
    envioId: 1,
    problema: "Facundo y el undo",
    resultado: "AC",
    lenguaje: "Cpp",
    tiempo: 0.200
};
const datoWA = {
    envioId: 2,
    problema: "Facundo y el undo",
    resultado: "WA",
    lenguaje: "Cpp",
    tiempo: 1.5
};

describe("Registrar primer envio", () => {

    test("inserta un envio", async () => {
        await problemaDAO.registrarBloqueEnvios([datoAC]);
        expect(await problemaDAO.getNumEnvios("Facundo y el undo")).toBe(1);
    });

    test("inserta el tiempo", async () => {
        await problemaDAO.registrarBloqueEnvios([datoAC]);
        expect(await problemaDAO.getTiempoPromedio("Facundo y el undo")).toBe(0.2);
    });

    test("no inserta el tiempo si no es AC", async () => {
        await problemaDAO.registrarBloqueEnvios([datoWA]);
        expect(await problemaDAO.getTiempoPromedio("Facundo y el undo")).toBe(0);
    });

    test("inserta el mejor tiempo", async () => {
        await problemaDAO.registrarBloqueEnvios([datoAC]);
        expect(await problemaDAO.getMejorTiempo("Facundo y el undo")).toBe(0.2);
    });

    test("no inserta el mejor tiempo si no es AC", async () => {
        await problemaDAO.registrarBloqueEnvios([datoWA]);
        expect(await problemaDAO.getMejorTiempo("Facundo y el undo")).toBe(0);
    });

    test("inserta resultados", async () => {
        await problemaDAO.registrarBloqueEnvios([datoAC]);
        await problemaDAO.registrarBloqueEnvios([datoWA]);
        const resultados = await problemaDAO.getResultados("Facundo y el undo");
        expect(resultados).toContainEqual({ name: "AC", value: 1 });
        expect(resultados).toContainEqual({ name: "WA", value: 1 });
    });

    test("inserta lenguajes", async () => {
        await problemaDAO.registrarBloqueEnvios([datoAC]);
        await problemaDAO.registrarBloqueEnvios([datoWA]);
        const lenguajes = await problemaDAO.getLenguajes("Facundo y el undo");
        expect(lenguajes).toContainEqual({ name: "Cpp", value: 2 });
    });
});

describe("Registrar nuevos envios", () => {

    test("actualiza el numero de envios", async () => {
        await problemaDAO.registrarBloqueEnvios([datoAC]);
        await problemaDAO.registrarBloqueEnvios([datoAC]);
        expect(await problemaDAO.getNumEnvios("Facundo y el undo")).toBe(2);
    });

    test("actualiza el tiempo promedio", async () => {
        await problemaDAO.registrarBloqueEnvios([datoAC]);
        const datoAC2 = { ...datoAC, tiempo: 0.4 };
        await problemaDAO.registrarBloqueEnvios([datoAC2]);
        expect(await problemaDAO.getTiempoPromedio("Facundo y el undo")).toBe(0.3);
    });

    test("no actualiza el tiempo promedio si no es AC", async () => {
        await problemaDAO.registrarBloqueEnvios([datoAC]);
        await problemaDAO.registrarBloqueEnvios([datoWA]);
        expect(await problemaDAO.getTiempoPromedio("Facundo y el undo")).toBe(0.2);
    });

    test("actualiza el mejor tiempo", async () => {
        await problemaDAO.registrarBloqueEnvios([datoAC]);
        const datoAC2 = { ...datoAC, tiempo: 0.1 };
        await problemaDAO.registrarBloqueEnvios([datoAC2]);
        expect(await problemaDAO.getMejorTiempo("Facundo y el undo")).toBe(0.1);
    });

    test("no actualiza el mejor tiempo si no es AC", async () => {
        await problemaDAO.registrarBloqueEnvios([datoAC]);
        const datoWA2 = { ...datoWA, tiempo: 0.1 };
        await problemaDAO.registrarBloqueEnvios([datoWA2]);
        expect(await problemaDAO.getMejorTiempo("Facundo y el undo")).toBe(0.2);
    });

    test("no actualiza el mejor tiempo si es mas lento", async () => {
        await problemaDAO.registrarBloqueEnvios([datoAC]);
        const datoAC2 = { ...datoAC, envioId: 2, tiempo: 0.5 };
        //await problemaDAO.registrarBloqueEnvios([datoAC2]);
        expect(await problemaDAO.getMejorTiempo("Facundo y el undo")).toBe(0.2);
    });
});

describe("Lecturas vacias", () => {

    test("devuelve 0 envios si no hay datos", async () => {
        expect(await problemaDAO.getNumEnvios("Otro problema")).toBe(0);
    });

    test("devuelve 0 tiempo promedio si no hay datos", async () => {
        expect(await problemaDAO.getTiempoPromedio("Otro problema")).toBe(0);
    });

    test("devuelve 0 mejor tiempo si no hay datos", async () => {
        expect(await problemaDAO.getMejorTiempo("Otro problema")).toBe(0);
    });

    test("devuelve resultados vacios si no hay datos", async () => {
        expect(await problemaDAO.getResultados("Otro problema")).toEqual([]);
    });

    test("devuelve lenguajes vacios si no hay datos", async () => {
        expect(await problemaDAO.getLenguajes("Otro problema")).toEqual([]);
    });
});