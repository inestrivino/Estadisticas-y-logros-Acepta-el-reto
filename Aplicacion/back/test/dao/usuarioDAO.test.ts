import { describe, test, expect } from 'vitest';
import usuarioDAO from '../../src/dao/usuarioDAO.js';
import { EstadoUsuario } from '../../src/types/estadoUsuario.js';
import setUpTestFile from './setUptTest.ts';
import dateToTimestamp from '../../src/utils/fecha.ts';

setUpTestFile(usuarioDAO);

const dato = {
    envioId: 1,
    usuario: "user1",
    problema: "p1",
    categoria: "",
    resultado: "AC",
    lenguaje: "Cpp",
    fecha: dateToTimestamp({ dia: 17, mes: 2, anio: 2025 }),
    hora: 10
};

describe("Registrar datos de usuario", () => {

    test("Un envio cada lunes", async () => {
        //mete un envio cada lunes durante un anio
        const fecha = new Date(2025, 2, 17);
        const diasValor = new Map<number, number>();

        for (let i = 0; i < 53; i++) {
            const timestamp = dateToTimestamp({ dia: fecha.getDate(), mes: fecha.getMonth(), anio: fecha.getFullYear() });
            diasValor.set(timestamp, (diasValor.get(timestamp) ?? 0) + 1);
            fecha.setDate(fecha.getDate() + 7);
        }

        const estado: EstadoUsuario = {
            numEnvios: 53,
            problemasAC: new Set(["p1"]),
            problemasNoAC: new Set(),
            resultados: new Map([["AC", 53]]),
            lenguajes: new Set(["Cpp"]),
            lenguajesConteo: new Map([["Cpp", 53]]),
            lenguajesAC: new Map([["Cpp", 53]]),
            lenguajesProblemasResueltos: new Map([["Cpp", new Set(["p1"])]]),
            diasValor,
            rachaEnviosAC: 53,
            rachaEnviosACMax: 53,
            rachaDiasEnvio: 0,
            rachaDiasEnvioMax: 0,
            ultimoDiaEnvio: dateToTimestamp({ dia: fecha.getDate(), mes: fecha.getMonth(), anio: fecha.getFullYear() }),
            horas: new Set([0]),
            logros: new Set(),
        };

        await usuarioDAO.registrarEstadosUsuarios(new Map([["user1", estado]]));

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
        await usuarioDAO.registrarEstadosUsuarios(new Map([[dato.usuario, {
            numEnvios: 1,
            problemasAC: new Set([dato.problema]),
            problemasNoAC: new Set(),
            resultados: new Map([[dato.resultado, 1]]),
            lenguajes: new Set([dato.lenguaje]),
            lenguajesConteo: new Map([[dato.lenguaje, 1]]),
            lenguajesAC: new Map([[dato.lenguaje, 1]]),
            lenguajesProblemasResueltos: new Map([[dato.lenguaje, new Set([dato.problema])]]),
            diasValor: new Map([[dato.fecha, 1]]),
            rachaEnviosAC: 1,
            rachaEnviosACMax: 1,
            rachaDiasEnvio: 1,
            rachaDiasEnvioMax: 1,
            ultimoDiaEnvio: dato.fecha,
            horas: new Set([dato.hora]),
            logros: new Set(),
        }]]));

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
