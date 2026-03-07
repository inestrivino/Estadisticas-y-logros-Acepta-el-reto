import redisClient from '../redis/redisClient.js';

type datosProblema = {
    "problema": string,
    "resultado": string,
    "lenguaje": string,
    "tiempo": number,
};

export default class ProblemaDAO {
    private redis;

    constructor() {
        this.redis = redisClient;
    }

    async registrarEnvio(dato: datosProblema): Promise<void> {

        //juntas las operaciones para hacer solo una llamada de escritura
        const pipeline = this.redis.multi();
        
        if (dato.resultado === "AC") {
            const tiempoMinStr = await this.redis.get(`problema:${dato.problema}:mejorTiempo`);
            const tiempoMin = tiempoMinStr ? Number(tiempoMinStr) : Infinity;
            if (dato.tiempo < tiempoMin)
                pipeline.set(`problema:${dato.problema}:mejorTiempo`, dato.tiempo.toString());
        }

        pipeline.incr(`problema:${dato.problema}:envios`);
        pipeline.hIncrBy(`problema:${dato.problema}:resultados`, dato.resultado, 1);
        pipeline.hIncrBy(`problema:${dato.problema}:lenguajes`, dato.lenguaje, 1);

        if (dato.resultado === "AC")
            pipeline.incrByFloat(`problema:${dato.problema}:tiempoTotal`, dato.tiempo);

        await pipeline.exec();
    }

    async getNumEnvios(problema: string): Promise<number> {
        const numEnvios = await this.redis.get(`problema:${problema}:envios`);
        return numEnvios ? Number(numEnvios) : 0;
    }

    async getMejorTiempo(problema: string):Promise<number|null> {
        const mejorTiempo = await this.redis.get(`problema:${problema}:mejorTiempo`);
        return mejorTiempo ? Number(mejorTiempo) : null;
    }

    async getTiempoPromedio(problema: string): Promise<number> {
        const numAciertos = await this.redis.hGet(`problema:${problema}:resultados`, 'AC');
        const tiempoTotal = await this.redis.get(`problema:${problema}:tiempoTotal`);

        const numAciertosNum = numAciertos ? Number(numAciertos) : 0;
        const tiempoTotalNum = tiempoTotal ? Number(tiempoTotal) : 0;

        return numAciertosNum > 0 ? tiempoTotalNum / numAciertosNum : 0;
    }

    async getResultados(problema: string): Promise<{name: string, value: number}[]> {
        const datos = await this.redis.hGetAll(`problema:${problema}:resultados`);

        const formateados: {name: string, value: number}[] = [];
        for (const aux of Object.entries(datos))
            formateados.push({name:aux[0], value:Number(aux[1])})

        formateados.sort((a, b) => a.name.localeCompare(b.name));

        return formateados;
    }

    async getLenguajes(problema: string): Promise<{name: string, value: number}[]> {
        const datos = await this.redis.hGetAll(`problema:${problema}:lenguajes`);

        const formateados: {name: string, value: number}[] = [];
        for (const aux of Object.entries(datos))
            formateados.push({name:aux[0], value:Number(aux[1])})

        formateados.sort((a, b) => a.name.localeCompare(b.name));

        return formateados;
    }
}