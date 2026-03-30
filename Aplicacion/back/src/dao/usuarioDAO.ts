import DAO from "./DAO.js"

type datosUsuario = {
    envioId: number,
    usuario: string,
    resultado: string,
    lenguaje: string,
    fecha: {
        dia: number,
        mes: number,
        anio: number
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

        //INCREMENTA LOS ENVIOS DE UN USUARIO
        //primero registra el dia del envio
        pipeline.zAdd(
            `usuario:${dato.usuario}:dias`,
            [{ value: String(timeStamp), score: timeStamp }]
        );
        //luego suma 1 a los envios de ese dia
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
    async getResultados(usuario: string): Promise<{name: string, value: number}[]> {
        const datos = await this.redis.hGetAll(`usuario:${usuario}:resultados`);

        const formateados: {name: string, value: number}[] = [];
        for (const aux of Object.entries(datos))
            formateados.push({name:aux[0], value:Number(aux[1])})

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

    /**
     * Devuelve los envios dentro de un periodo de tiempo
     * @param usuario - usuario del que se quiero hacer la consulta
     * @param timeIni - timestamp en segundos de la hora 00:00 del primero dia del intervalo
     * @param timeFin - timestamp en segundos de la hora 00:00 del ultimo dia del intervalo                 
     * @returns - un array con tantos elementos {timestamp:number, value:number} como dias en el intervalo
     */
    async getEnviosUsuario(usuario: string, timeIni: number, timeFin: number) {

        //saco los dias (timeStamps) en los que hizo envios y la cantidad (valores)
        const timeStamps = await this.redis.zRangeWithScores(`usuario:${usuario}:dias`, 0, -1);
        const valores = await this.redis.hGetAll(`usuario:${usuario}:diasValor`);

        //vinculo cada dia con su cantidad
        let resultados = []
        for (const timeStamp of timeStamps) {
            //por si se han quedado datos viejos por algun error solo coge los nuevos
            if (timeStamp.score < timeIni)
                continue;
            //por si en algun momento se quisiera pedir un intervalo que no llega hasta hoy
            if (timeStamp.score > timeFin)
                continue;
            
            resultados.push({
                timeStamp: timeStamp.score,
                value: Number(valores[timeStamp.value])
            });
        }

        //formateo los datos
        let formateados = [];
        let contador = 0;
        let current = -1;
        if (resultados.length > 0)
            current = resultados[0].timeStamp;
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
            //TODO quitar tambien de diasValor
        }

        await pipeline.exec();

        //se borra el set con los usuario de ese dia
        await this.redis.del(`timestamp:${timeStamp}`);
    }
}