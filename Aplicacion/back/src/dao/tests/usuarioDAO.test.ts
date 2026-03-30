import { describe, test, expect } from 'vitest';
import UsuarioDAO from '../usuarioDAO.js';
import setUpTestFile from './setUptTest.js';

let usuarioDAO = new UsuarioDAO();

setUpTestFile(usuarioDAO);

const dato = {
    envioId: 1,
    usuario: "user1",
    resultado: "AC",
    lenguaje: "Cpp",
    fecha: {
        dia: 17,
        mes: 2, //marzo
        anio: 2025
    }
};

describe("Registrar datos de usuario", () => {

    test("coge bien lo dias", async () => {
        await usuarioDAO.registrarDirecto(dato);
        const fin = new Date(2026, 2, 16);
        const timeFin = fin.valueOf() / 1000;
        const timeIni = timeFin - 31449600; //364 * 24 * 60 * 60
        
        let res:{}[] = [];
        for (let i = timeIni; i <= timeFin; i += 86400) { // 86400 = 24 * 60 * 60
            res.push({
                timeStamp: i,
                value: 0
            })
        }
        res[0] = {timeStamp: timeIni, value: 1};

        const consulta = await usuarioDAO.getEnviosUsuario("user1", timeIni, timeFin);
        expect(consulta[0].timeStamp).toBe(timeIni);
        expect(consulta[364].timeStamp).toBe(timeFin);
        expect(consulta.length).toBe(365);
        expect(consulta).toStrictEqual(res);
    });

    test("coge bien los dias un anio bisiesto", async () => {
        await usuarioDAO.registrarDirecto(dato);
        const fin = new Date(2024, 2, 16);
        const timeFin = fin.valueOf() / 1000;
        const timeIni = timeFin - 31449600; //364 * 24 * 60 * 60

        let res:{}[] = [];
        for (let i = timeIni; i <= timeFin; i += 86400) { // 86400 = 24 * 60 * 60
            res.push({
                timeStamp: i,
                value: 0
            })
        }

        const consulta = await usuarioDAO.getEnviosUsuario("user1", timeIni, timeFin);
        expect(consulta[0].timeStamp).toBe(timeIni);
        expect(consulta[364].timeStamp).toBe(timeFin);
        expect(consulta.length).toBe(365);
        expect(consulta).toStrictEqual(res);
    });
});

describe("Lecturas vacias", () => {

    test("devuelve resultados vacios si no hay datos", async () => {
        expect(await usuarioDAO.getResultados("usuario-1")).toEqual([]);
    });

    test("devuelve lenguajes vacios si no hay datos", async () => {
        expect(await usuarioDAO.getLenguajes("usuario-1")).toEqual([]);
    });
});