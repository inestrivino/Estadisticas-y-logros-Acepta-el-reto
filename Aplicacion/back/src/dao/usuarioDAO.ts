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
                formateados.push({timeStamp:i, value: 0});
            }
            else {
                formateados.push({timeStamp:i, value:resultados[contador].value});
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
        }

        await pipeline.exec();

        //se borra el set con los usuario de ese dia
        await this.redis.del(`timestamp:${timeStamp}`);
    }
}