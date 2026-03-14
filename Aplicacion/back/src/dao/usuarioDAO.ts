import DAO from "./DAO.js"

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