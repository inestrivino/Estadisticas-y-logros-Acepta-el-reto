import redisClient from "../redis/redisClient.js";
import DAO from "./DAO.js";
import logros from "../data/logros.js";

type datosUsuario = {
    envioId: number,
    usuario: string,
    resultado: string,
    lenguaje: string,
    fecha: {
        dia: number,
        mes: number,
        anio: number,
        hora: number
    }
};

export default class UsuarioDAO extends DAO {

    //Funcion para introducir solo 1 datos
    async registrarDirecto(dato: datosUsuario): Promise<void> {
        const pipeline = this.redis.multi();
        await this.agregarAlPipeline(dato, pipeline);
        await pipeline.exec();
    }

    async agregarAlPipeline(dato: datosUsuario, pipeline: any): Promise<void> {
        //guardo el timeStamp en segundos
        const fecha = new Date(dato.fecha.anio, dato.fecha.mes, dato.fecha.dia);
        const timeStamp = fecha.valueOf() / 1000;

        //incrementa los envios de un usuario
        pipeline.zAdd(
            `usuario:${dato.usuario}:dias`,
            [{ value: String(dato.envioId), score: timeStamp }]
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


        pipeline.hIncrBy(`usuario:${dato.usuario}:resultados`, dato.resultado, 1);
        pipeline.hIncrBy(`usuario:${dato.usuario}:lenguajes`, dato.lenguaje, 1);
    }

    //TODO poner jdoc
    //Devuelve el resultado ordenado alfabeticamente por nombre
    async getResultados(usuario: string): Promise<{ name: string, value: number }[]> {
        const datos = await this.redis.hGetAll(`usuario:${usuario}:resultados`);

        const formateados: { name: string, value: number }[] = [];
        for (const aux of Object.entries(datos))
            formateados.push({ name: aux[0], value: Number(aux[1]) })

        formateados.sort((a, b) => a.name.localeCompare(b.name));

        return formateados;
    }

    //TODO poner jdoc
    //Devuelve el resultado ordenado alfabeticamente por nombre
    async getLenguajes(usuario: string): Promise<{name: string, value: number}[]> {
        const datos = await this.redis.hGetAll(`usuario:${usuario}:lenguajes`);

        const formateados: {name: string, value: number}[] = [];
        for (const aux of Object.entries(datos))
            formateados.push({name:aux[0], value:Number(aux[1])})

        formateados.sort((a, b) => a.name.localeCompare(b.name));

        return formateados;
    }

    async getEnviosUsuario(usuario: String, timeIni: number, timeFin: number) {

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

        //formateo los datos
        let formateados = [];
        let contador = 0;
        let current = resultados[0].timeStamp;
        for (let i = timeIni; i <= timeFin; i += 86400) { // 86400 = 24 * 60 * 60
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

        //agrega el etributo de si el usuario tiene ese logro o no
        const logrosUsuario = logros.map(logro => ({ ...logro, obtenido: setLogros.has(logro.nombre) }));

        //agrupa todos los logros en los grupos correspondientes segun la clasificacion seleccionada
        const gruposMap = new Map();
        for (const logro of logrosUsuario) {
            const key = clasificacion === "nivel" ? logro.nivel : logro.categoria;
            if (!gruposMap.has(key)) {
                gruposMap.set(key, []);
            }
            gruposMap.get(key).push(logro);
        }

        //transforma el map a una estructura similar a la del tipo TGrupoLogros 
        const grupos = Array.from(gruposMap.entries()).map(([grupo, logros]) => ({ grupo, logros }));
        return { clasificacion, grupos };
    }

    async guardarLogros(usuario: string, logros: string[], pipeline?: any) {
        if (logros.length > 0) {
            if (pipeline) {
                pipeline.sAdd(`usuario:${usuario}:logros`, logros);
            }
            else {
                await redisClient.sAdd(`usuario:${usuario}:logros`, logros);
            }
        }
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

    // TODO esto mas adelante analizara el nuevo envio y los datos de usuario para ver si de verdad se ha alcanzado algun logro
    async logrosAlcanzados(dato: datosUsuario) {
        return ["logro1", "logro13"];
    }
}