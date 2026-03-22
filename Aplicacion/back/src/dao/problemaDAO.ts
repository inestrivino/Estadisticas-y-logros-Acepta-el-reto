import DAO from "./DAO.js"

type datosProblema = {
    envioId: number,
    problema: string,
    resultado: string,
    lenguaje: string,
    tiempo: number,
};

export default class ProblemaDAO extends DAO {

    //Funcion para introducir solo 1 datos
    async registrarDirecto(dato: datosProblema): Promise<void> {
        const pipeline = this.redis.multi();
        await this.agregarAlPipeline(dato, pipeline);
        await pipeline.exec();
    }

    async agregarAlPipeline(dato: datosProblema, pipeline: any): Promise<void> { 
        pipeline.incr(`problema:${dato.problema}:envios`);
        pipeline.hIncrBy(`problema:${dato.problema}:resultados`, dato.resultado, 1);
        pipeline.hIncrBy(`problema:${dato.problema}:lenguajes`, dato.lenguaje, 1);

        if (dato.resultado === "AC") {
            pipeline.incrByFloat(`problema:${dato.problema}:tiempoTotal`, dato.tiempo);
            pipeline.zAdd(`problema:${dato.problema}:tiemposEnvios`, {score: dato.tiempo, value: String(dato.envioId)});
        }
    }

    //Devuelve el numero de envios o 0 si no hay ninguno
    async getNumEnvios(problema: string): Promise<number> {
        const numEnvios = await this.redis.get(`problema:${problema}:envios`);
        return numEnvios ? Number(numEnvios) : 0;
    }

    //Devuelve el mejor tiempo o 0 si no hay ninguno
    async getMejorTiempo(problema: string):Promise<number|null> {
        //const mejorTiempo = await this.redis.get(`problema:${problema}:mejorTiempo`);
        const aux = await this.redis.zRangeWithScores(`problema:${problema}:tiemposEnvios`, 0, 0);
        if (aux.length === 0)
            return 0;
        const mejorTiempo = aux[0].score;
        return mejorTiempo ? Number(mejorTiempo) : 0;
    }

    //Devuelve el tiempo promedio o 0 si no hay ninguno
    async getTiempoPromedio(problema: string): Promise<number> {
        const numAciertos = await this.redis.hGet(`problema:${problema}:resultados`, 'AC');
        const tiempoTotal = await this.redis.get(`problema:${problema}:tiempoTotal`);

        const numAciertosNum = numAciertos ? Number(numAciertos) : 0;
        const tiempoTotalNum = tiempoTotal ? Number(tiempoTotal) : 0;

        return numAciertosNum > 0 ? tiempoTotalNum / numAciertosNum : 0;
    }

    //Devuelve el resultado ordenado alfabeticamente por nombre
    async getResultados(problema: string): Promise<{name: string, value: number}[]> {
        const datos = await this.redis.hGetAll(`problema:${problema}:resultados`);

        const formateados: {name: string, value: number}[] = [];
        for (const aux of Object.entries(datos))
            formateados.push({name:aux[0], value:Number(aux[1])})

        formateados.sort((a, b) => a.name.localeCompare(b.name));

        return formateados;
    }

    //Devuelve el resultado ordenado alfabeticamente por nombre
    async getLenguajes(problema: string): Promise<{name: string, value: number}[]> {
        const datos = await this.redis.hGetAll(`problema:${problema}:lenguajes`);

        const formateados: {name: string, value: number}[] = [];
        for (const aux of Object.entries(datos))
            formateados.push({name:aux[0], value:Number(aux[1])})

        formateados.sort((a, b) => a.name.localeCompare(b.name));

        return formateados;
    }
}