import { describe, test, expect } from 'vitest';
import UsuarioDAO from '../usuarioDAO.js';
import setUpTestFile from './setUptTest.js';

let usuarioDAO = new UsuarioDAO();

setUpTestFile(usuarioDAO);

const dato = {
    usuario: "user1",
    resultado: "AC",
    lenguaje: "Cpp",
    fecha: {
        dia: 17,
        mes: 2, //marzo
        anio: 2025
    }
};

describe("Pruebas", () => {
    test("coge bien lo dias", async () => {
        await usuarioDAO.registrarDatosUsuario(dato);
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
        await usuarioDAO.registrarDatosUsuario(dato);
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