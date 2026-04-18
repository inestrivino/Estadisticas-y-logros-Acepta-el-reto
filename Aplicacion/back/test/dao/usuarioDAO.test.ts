import { describe, test, expect } from 'vitest';
import usuarioDAO from '../../src/dao/usuarioDAO.js';
import setUpTestFile from './setUptTest.ts';
import dateToTimestamp from '../../src/utils/fecha.ts';

setUpTestFile(usuarioDAO);

const dato = {
    envioId: 1,
    usuario: "user1",
    problema: "p1",
    resultado: "AC",
    lenguaje: "Cpp",
    fecha: {
        dia: 17,
        mes: 2, //marzo
        anio: 2025,
        hora: 10
    }
};

describe("Registrar datos de usuario", () => {

    test("Un envio cada lunes", async () => {
        //mete un envio cada lunes durante un anio 
        const fecha = new Date(2025, 2, 17);
        for (let i = 0; i < 53; i++) {
            const dato = {
                envioId: i + 1,
                usuario: "user1",
                problema: "p1",
                resultado: "AC",
                lenguaje: "Cpp",
                fecha: {
                    dia: fecha.getDate(),
                    mes: fecha.getMonth(),
                    anio: fecha.getFullYear(),
                    hora: fecha.getHours()
                }
            };

            await usuarioDAO.registrarDirecto(dato);

            fecha.setDate(fecha.getDate() + 7);
        }
        
        const timeIni = dateToTimestamp({dia: 17, mes: 2, anio: 2025});
        const timeFin = dateToTimestamp({dia: 16, mes: 2, anio: 2026});

        let res: {}[] = [];
        for (let i = timeIni; i <= timeFin; i += 86400) { // 86400 = 24 * 60 * 60
            if ((i - timeIni) % (86400 * 7) === 0) {
                res.push({
                    timeStamp: i,
                    value: 1
                })
            }
            else {
                res.push({
                    timeStamp: i,
                    value: 0
                })
            }
        }

        const consulta = await usuarioDAO.getEnviosUsuario("user1", timeIni, timeFin);
        expect(consulta[0].timeStamp).toBe(timeIni);
        expect(consulta[364].timeStamp).toBe(timeFin);
        expect(consulta.length).toBe(365);
        expect(consulta).toStrictEqual(res);
    });

    test("coge bien los dias un anio bisiesto", async () => {
        
        const timeIni = dateToTimestamp({dia: 17, mes: 2, anio: 2024});
        const timeFin = dateToTimestamp({dia: 16, mes: 2, anio: 2025});

        let res: {}[] = [];
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

    test("coge bien lo dias", async () => {
        await usuarioDAO.registrarDirecto(dato);

        const timeIni = dateToTimestamp({dia: 17, mes: 2, anio: 2025});
        const timeFin = dateToTimestamp({dia: 16, mes: 2, anio: 2026});

        let res: {}[] = [];
        for (let i = timeIni; i <= timeFin; i += 86400) { // 86400 = 24 * 60 * 60
            res.push({
                timeStamp: i,
                value: 0
            })
        }
        res[0] = { timeStamp: timeIni, value: 1 };

        const consulta = await usuarioDAO.getEnviosUsuario("user1", timeIni, timeFin);
        expect(consulta[0].timeStamp).toBe(timeIni);
        expect(consulta[364].timeStamp).toBe(timeFin);
        expect(consulta.length).toBe(365);
        expect(consulta).toStrictEqual(res);
    });
});