import { describe, test, expect } from 'vitest';
import usuarioDAO from '../../src/dao/usuarioDAO.js';
import { EstadoUsuario } from '../../src/types/estados/estadoUsuario.js';
import { CampoUsuario } from '../../src/types/estados/camposEstadoUsuario.js';
import setUpTestFile from './setUptTest.ts';

setUpTestFile(usuarioDAO);

const dato = {
    envioId: 1,
    usuario: "user1",
    problema: "p1",
    categoria: "",
    resultado: "AC",
    lenguaje: "cpp",
    fecha: 1742169600,
    hora: 10
};

describe("Registrar datos de usuario", () => {

    test("Un envio cada lunes", async () => {
        //mete un envio cada lunes durante un anio
        const fecha = new Date(2025, 2, 17);
        const diasValor = new Map<number, number>();

        for (let i = 0; i < 53; i++) {
            const timestamp = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())).valueOf() / 1000;
            diasValor.set(timestamp, (diasValor.get(timestamp) ?? 0) + 1);
            fecha.setDate(fecha.getDate() + 7);
        }

        const estado: EstadoUsuario = {
            [CampoUsuario.NUM_ENVIOS]: true,
            numEnvios: 53,
            [CampoUsuario.PROBLEMAS]: true,
            problemasAC: new Set(["p1"]),
            problemasNoAC: new Set(),
            [CampoUsuario.RESULTADOS]: true,
            resultados: new Map([["AC", 53]]),
            [CampoUsuario.LENGUAJES]: true,
            lenguajes: new Set(["cpp"]),
            lenguajesConteo: new Map([["cpp", 53]]),
            lenguajesAC: new Map([["cpp", 53]]),
            lenguajesProblemasResueltos: new Map([["cpp", new Set(["p1"])]]),
            [CampoUsuario.DIAS_VALOR]: true,
            diasValor,
            [CampoUsuario.RACHAS]: true,
            rachaEnviosAC: 53,
            rachaEnviosACMax: 53,
            rachaDiasEnvio: 0,
            rachaDiasEnvioMax: 0,
            ultimoDiaEnvio: new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())).valueOf() / 1000,
            [CampoUsuario.HORAS]: true,
            horas: new Set([0]),
            [CampoUsuario.LOGROS]: true,
            logros: new Set(),
        };

        await usuarioDAO.registrarEstadosUsuarios(new Map([["user1", estado]]));

        const timeIni = 1742169600;
        const timeFin = 1773619200;

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

        const timeIni = 1710633600;
        const timeFin = 1742083200;

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
            [CampoUsuario.NUM_ENVIOS]: true,
            numEnvios: 1,
            [CampoUsuario.PROBLEMAS]: true,
            problemasAC: new Set([dato.problema]),
            problemasNoAC: new Set(),
            [CampoUsuario.RESULTADOS]: true,
            resultados: new Map([[dato.resultado, 1]]),
            [CampoUsuario.LENGUAJES]: true,
            lenguajes: new Set([dato.lenguaje]),
            lenguajesConteo: new Map([[dato.lenguaje, 1]]),
            lenguajesAC: new Map([[dato.lenguaje, 1]]),
            lenguajesProblemasResueltos: new Map([[dato.lenguaje, new Set([dato.problema])]]),
            [CampoUsuario.DIAS_VALOR]: true,
            diasValor: new Map([[dato.fecha, 1]]),
            [CampoUsuario.RACHAS]: true,
            rachaEnviosAC: 1,
            rachaEnviosACMax: 1,
            rachaDiasEnvio: 1,
            rachaDiasEnvioMax: 1,
            ultimoDiaEnvio: dato.fecha,
            [CampoUsuario.HORAS]: true,
            horas: new Set([dato.hora]),
            [CampoUsuario.LOGROS]: true,
            logros: new Set(),
        }]]));

        const timeIni = 1742169600;
        const timeFin = 1773619200;

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
