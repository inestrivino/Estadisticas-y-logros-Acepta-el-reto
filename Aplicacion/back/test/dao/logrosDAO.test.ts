import { describe, test, expect } from 'vitest';
import logrosDAO from '../../src/dao/logrosDAO.js';
import setUpTestFile from './setUptTest.ts';

await setUpTestFile(logrosDAO);

describe("Guardar logros", () => {

    test("guarda un logro de un usuario", async () => {
        await logrosDAO.guardarBloqueLogros([{ usuario: "Facundo", logros: ["primer_ac"] }]);
        expect(await logrosDAO.getLogros("Facundo")).toContain("primer_ac");
    });

    test("guarda varios logros de un usuario", async () => {
        await logrosDAO.guardarBloqueLogros([{ usuario: "Facundo", logros: ["primer_ac", "racha_7"] }]);
        const logros = await logrosDAO.getLogros("Facundo");
        expect(logros).toContain("primer_ac");
        expect(logros).toContain("racha_7");
    });

    test("guarda logros de varios usuarios en el mismo bloque", async () => {
        await logrosDAO.guardarBloqueLogros([
            { usuario: "Facundo", logros: ["primer_ac"] },
            { usuario: "Nestor", logros: ["racha_7"] }
        ]);
        expect(await logrosDAO.getLogros("Facundo")).toContain("primer_ac");
        expect(await logrosDAO.getLogros("Nestor")).toContain("racha_7");
    });

    test("no mezcla logros entre usuarios", async () => {
        await logrosDAO.guardarBloqueLogros([
            { usuario: "Facundo", logros: ["primer_ac"] },
            { usuario: "Nestor", logros: ["racha_7"] }
        ]);
        expect(await logrosDAO.getLogros("Facundo")).not.toContain("racha_7");
        expect(await logrosDAO.getLogros("Nestor")).not.toContain("primer_ac");
    });

    test("acumula logros en llamadas sucesivas", async () => {
        await logrosDAO.guardarBloqueLogros([{ usuario: "Facundo", logros: ["primer_ac"] }]);
        await logrosDAO.guardarBloqueLogros([{ usuario: "Facundo", logros: ["racha_7"] }]);
        const logros = await logrosDAO.getLogros("Facundo");
        expect(logros).toContain("primer_ac");
        expect(logros).toContain("racha_7");
    });

    test("no duplica un logro ya guardado", async () => {
        await logrosDAO.guardarBloqueLogros([{ usuario: "Facundo", logros: ["primer_ac"] }]);
        await logrosDAO.guardarBloqueLogros([{ usuario: "Facundo", logros: ["primer_ac"] }]);
        const logros = await logrosDAO.getLogros("Facundo");
        expect(logros.filter(l => l === "primer_ac")).toHaveLength(1);
    });

    test("ignora usuarios con array de logros vacio", async () => {
        await logrosDAO.guardarBloqueLogros([{ usuario: "Facundo", logros: [] }]);
        expect(await logrosDAO.getLogros("Facundo")).toEqual([]);
    });

    test("ignora entradas vacias y guarda las que tienen logros", async () => {
        await logrosDAO.guardarBloqueLogros([
            { usuario: "Facundo", logros: [] },
            { usuario: "Nestor", logros: ["primer_ac"] }
        ]);
        expect(await logrosDAO.getLogros("Facundo")).toEqual([]);
        expect(await logrosDAO.getLogros("Nestor")).toContain("primer_ac");
    });
});

describe("Lecturas vacias", () => {

    test("devuelve array vacio si el usuario no tiene logros", async () => {
        expect(await logrosDAO.getLogros("Facundo")).toEqual([]);
    });

    test("devuelve array vacio si el usuario no existe", async () => {
        expect(await logrosDAO.getLogros("noexiste")).toEqual([]);
    });
});
