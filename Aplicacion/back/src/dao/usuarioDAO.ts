import DAO from "./DAO.js";
import logros from "src/data/logros.js";

type datosUsuario = {
    "usuario": string,
    "resultado": string,
    "lenguaje": string
};

//TODO hacer los tests de este DAO

export default class UsuarioDAO extends DAO {

    async registrarDatosUsuario(dato: datosUsuario): Promise<void> {

        //guardo el timeStamp en segundos
        const hoy = new Date;
        hoy.setHours(0, 0, 0, 0);
        const timeStamp = hoy.valueOf() / 1000;

        //juntas las operaciones para hacer solo una llamada de escritura
        const pipeline = this.redis.multi();

        //incrementa los envios de un usuario
        pipeline.zAdd(
            `usuario:${dato.usuario}:dias`,
            [{ value: String(timeStamp), score: timeStamp }]
        );
        pipeline.hIncrBy(
            `usuario:${dato.usuario}:diasValor`,
            String(timeStamp),
            1
        );

        //mete el usuario en ese timestamp (para no iterar por los usuario al borrar)
        pipeline.sAdd(
            `timestamp:${timeStamp}`,
            dato.usuario
        )

        const nuevosLogros = await this.nuevosLogros(dato);
        if (nuevosLogros.length > 0) {
            pipeline.sAdd(`usuario:${dato.usuario}:logros`, nuevosLogros);
        }

        await pipeline.exec();
    }

    async getEnviosUsuario(usuario: String) {

        //saco los dias (timeStamps) en los que hizo envios y la cantidad (valores)
        const timeStamps = await this.redis.zRangeWithScores(`usuario:${usuario}:dias`, 0, -1);
        const valores = await this.redis.hGetAll(`usuario:${usuario}:diasValor`);

        //vinculo cada dia con su cantidad
        let resultados = []
        for (const timeStamp of timeStamps) {
            resultados.push({
                timeStamp: timeStamp.score,
                value: Number(valores[timeStamp.value])
            });
        }

        //devuelvo un array de 365 numeros
        const hoy = new Date;
        hoy.setHours(0, 0, 0, 0);
        const timeStamp = hoy.valueOf() / 1000; // timeStamp en segundos
        let haceUnAnio = timeStamp - 31536000 // 365 * 24 * 60 * 60;
        haceUnAnio += 86400; // 86400 = 24 * 60 * 60

        let formateados = [];
        let contador = 0;
        let current = resultados[0].timeStamp;
        for (let i = haceUnAnio; i <= timeStamp; i += 86400) { // 86400 = 24 * 60 * 60
            if (i != current) {
                formateados.push({ timeStamp: i, value: 0 });
            }
            else {
                formateados.push({ timeStamp: i, value: resultados[contador].value });
                contador++;
                if (contador != resultados.length)
                    current = resultados[contador].timeStamp;
            }
        }

        return formateados;
    }

    async eliminarEnviosDia(timeStamp: number) {

        const usuarios = await this.redis.sMembers(`timestamp:${timeStamp}`);

        //juntas las operaciones para hacer solo una llamada
        const pipeline = this.redis.multi();

        //se quitan los envios de todos los usuario que hicieron un envio ese dia
        for (const usuario of usuarios) {
            pipeline.zRem(`usuario:${usuario}:dias`, String(timeStamp));
            pipeline.hDel(`usuario:${usuario}:diasValor`, String(timeStamp));
        }

        await pipeline.exec();

        //se borra el set con los usuario de ese dia
        await this.redis.del(`timestamp:${timeStamp}`);
    }

    async getLogrosUsuario(usuario: string, clasificacion: string) {
        const setLogros = new Set(await this.redis.sMembers(`usuario:${usuario}:logros`));

        // agrega el etributo de si el usuario tiene ese logro o no
        const logrosUsuario = logros.map(logro => ({ ...logro, obtenido: setLogros.has(logro.nombre) }));

        // agrupa todos los logros en los grupos correspondientes segun la clasificacion seleccionada
        const gruposMap = new Map();
        for (const logro of logrosUsuario) {
            const key = clasificacion === "nivel" ? logro.nivel : logro.categoria;
            if (!gruposMap.has(key)) {
                gruposMap.set(key, []);
            }
            gruposMap.get(key).push(logro);
        }

        // transforma el map a una estructura similar a la del tipo GrupoLogros 
        const grupos = Array.from(gruposMap.entries()).map(([grupo, logros]) => ({ grupo, logros }));
        return { clasificacion, grupos };
    }

    async nuevosLogros(dato: datosUsuario) {
        const logrosAlcanzados = await this.logrosAlcanzados(dato);
        let logrosNuevos: string[] = [];

        for (const logro of logrosAlcanzados) {
            const obtenido = await this.redis.sIsMember(`usuario:${dato.usuario}:logros`, logro);
            if (!obtenido) {
                logrosNuevos.push(logro);
            }
        }
        return logrosNuevos;
    }

    async logrosAlcanzados(dato: datosUsuario) {
        return ["logro1"];
    }
}