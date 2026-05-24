import { describe, test, expect } from 'vitest';
import gestionDAO from '../../../src/dao/gestionDAO.js';
import setUpTestFile from './setUptTest.ts';

await setUpTestFile(gestionDAO);

describe("Ultimo envio", () => {

    test("devuelve 0 si no hay dato", async () => {
        expect(await gestionDAO.getUltimoEnvio()).toBe(0);
    });

    test("persiste el id del ultimo envio", async () => {
        await gestionDAO.setUltimoEnvio(42);
        expect(await gestionDAO.getUltimoEnvio()).toBe(42);
    });

    test("sobreescribe el valor anterior", async () => {
        await gestionDAO.setUltimoEnvio(10);
        await gestionDAO.setUltimoEnvio(99);
        expect(await gestionDAO.getUltimoEnvio()).toBe(99);
    });
});

describe("Primera pagina", () => {

    test("devuelve 0 si no hay dato", async () => {
        expect(await gestionDAO.getPrimeraPagina()).toBe(0);
    });

    test("persiste el numero de la primera pagina", async () => {
        await gestionDAO.setPrimeraPagina(5);
        expect(await gestionDAO.getPrimeraPagina()).toBe(5);
    });

    test("sobreescribe el valor anterior", async () => {
        await gestionDAO.setPrimeraPagina(3);
        await gestionDAO.setPrimeraPagina(7);
        expect(await gestionDAO.getPrimeraPagina()).toBe(7);
    });
});

describe("Ultima pagina", () => {

    test("devuelve 0 si no hay dato", async () => {
        expect(await gestionDAO.getUltimaPagina()).toBe(0);
    });

    test("persiste el numero de la ultima pagina", async () => {
        await gestionDAO.setUltimaPagina(20);
        expect(await gestionDAO.getUltimaPagina()).toBe(20);
    });

    test("sobreescribe el valor anterior", async () => {
        await gestionDAO.setUltimaPagina(15);
        await gestionDAO.setUltimaPagina(30);
        expect(await gestionDAO.getUltimaPagina()).toBe(30);
    });
});

describe("Porcentaje de carga", () => {

    test("devuelve 0 si no hay dato", async () => {
        expect(await gestionDAO.getPorcentajeCarga()).toBe(0);
    });

    test("persiste el porcentaje de carga", async () => {
        await gestionDAO.setPorcentajeCarga(50);
        expect(await gestionDAO.getPorcentajeCarga()).toBe(50);
    });

    test("sobreescribe el valor anterior", async () => {
        await gestionDAO.setPorcentajeCarga(25);
        await gestionDAO.setPorcentajeCarga(75);
        expect(await gestionDAO.getPorcentajeCarga()).toBe(75);
    });

    test("persiste el valor 100", async () => {
        await gestionDAO.setPorcentajeCarga(100);
        expect(await gestionDAO.getPorcentajeCarga()).toBe(100);
    });
});

describe("Independencia entre claves", () => {

    test("setUltimoEnvio no afecta a las paginas", async () => {
        await gestionDAO.setPrimeraPagina(1);
        await gestionDAO.setUltimaPagina(2);
        await gestionDAO.setUltimoEnvio(999);
        expect(await gestionDAO.getPrimeraPagina()).toBe(1);
        expect(await gestionDAO.getUltimaPagina()).toBe(2);
    });

    test("setPorcentajeCarga no afecta al ultimo envio", async () => {
        await gestionDAO.setUltimoEnvio(5);
        await gestionDAO.setPorcentajeCarga(80);
        expect(await gestionDAO.getUltimoEnvio()).toBe(5);
    });
});
