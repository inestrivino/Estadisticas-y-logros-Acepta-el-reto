import { describe, test, expect } from 'vitest';
import logrosDAO from '../../../src/dao/logrosDAO.js';
import setUpTestFile from './setUptTest.ts';

await setUpTestFile(logrosDAO);

const usuario = ("Facundo").toLowerCase().normalize("NFC").trim();
const usuarioAux = ("Nestor").toLowerCase().normalize("NFC").trim();

describe("Guardar logros", () => {

    test("guarda un logro de un usuario", async () => {
        await logrosDAO.guardarBloqueLogros([{ usuario: usuario, logros: [1] }]);
        expect(await logrosDAO.getLogros(usuario)).toContain(1);
    });

    test("guarda varios logros de un usuario", async () => {
        await logrosDAO.guardarBloqueLogros([{ usuario: usuario, logros: [1, 2] }]);
        const logros = await logrosDAO.getLogros(usuario);
        expect(logros).toContain(1);
        expect(logros).toContain(2);
    });

    test("guarda logros de varios usuarios en el mismo bloque", async () => {
        await logrosDAO.guardarBloqueLogros([
            { usuario: usuario, logros: [1] },
            { usuario: usuarioAux, logros: [2] }
        ]);
        expect(await logrosDAO.getLogros(usuario)).toContain(1);
        expect(await logrosDAO.getLogros(usuarioAux)).toContain(2);
    });

    test("no mezcla logros entre usuarios", async () => {
        await logrosDAO.guardarBloqueLogros([
            { usuario: usuario, logros: [1] },
            { usuario: usuarioAux, logros: [2] }
        ]);
        expect(await logrosDAO.getLogros(usuario)).not.toContain(2);
        expect(await logrosDAO.getLogros(usuarioAux)).not.toContain(1);
    });

    test("acumula logros en llamadas sucesivas", async () => {
        await logrosDAO.guardarBloqueLogros([{ usuario: usuario, logros: [1] }]);
        await logrosDAO.guardarBloqueLogros([{ usuario: usuario, logros: [2] }]);
        const logros = await logrosDAO.getLogros(usuario);
        expect(logros).toContain(1);
        expect(logros).toContain(2);
    });

    test("no duplica un logro ya guardado", async () => {
        await logrosDAO.guardarBloqueLogros([{ usuario: usuario, logros: [1] }]);
        await logrosDAO.guardarBloqueLogros([{ usuario: usuario, logros: [1] }]);
        const logros = await logrosDAO.getLogros(usuario);
        expect(logros.filter(l => l === 1)).toHaveLength(1);
    });

    test("ignora usuarios con array de logros vacio", async () => {
        await logrosDAO.guardarBloqueLogros([{ usuario: usuario, logros: [] }]);
        expect(await logrosDAO.getLogros(usuario)).toEqual([]);
    });

    test("ignora entradas vacias y guarda las que tienen logros", async () => {
        await logrosDAO.guardarBloqueLogros([
            { usuario: usuario, logros: [] },
            { usuario: usuarioAux, logros: [1] }
        ]);
        expect(await logrosDAO.getLogros(usuario)).toEqual([]);
        expect(await logrosDAO.getLogros(usuarioAux)).toContain(1);
    });
});

describe("Lecturas vacias", () => {

    test("devuelve array vacio si el usuario no tiene logros", async () => {
        expect(await logrosDAO.getLogros(usuario)).toEqual([]);
    });

    test("devuelve array vacio si el usuario no existe", async () => {
        expect(await logrosDAO.getLogros("noexiste")).toEqual([]);
    });
});
