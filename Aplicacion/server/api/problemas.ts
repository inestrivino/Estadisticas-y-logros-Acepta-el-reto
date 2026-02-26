import redisClient from '../redis/redisClient.ts';
import express from 'express';
const router = express.Router();

router.get("/", async (req, res) => {
    const envioIds = await redisClient.sMembers('problema:problema1:envios');
    const pipeline = redisClient.multi();

    for (const id of envioIds) {
        pipeline.hGet(`${id}`, 'resultado');
    }

    const datos = await pipeline.exec();

    const contador: Map<string, number> = new Map;

    for (const dato of datos) {
        const key = String(dato);

        //si no existe la clave se inicializa a 0 y suma 1
        contador.set(key, (contador.get(key) ?? 0) + 1);
    }

    const estados: Record<string, string> = {
        AC: "Aceptado",
        PE: "Error",
        WA: "Incorrecto",
        CE: "Error de compilación",
        RTE: "Error durante la ejecución",
        TLE: "Tiempo límite",
        MLE: "Límite de memoria",
        OLE: "Límite de salida",
        RF: "Función restringida",
        IQ: "En cola",
        IE: "Error interno",
    };

    Object.keys(contador).sort()

    const formateados:{}[] = [];
    for (const aux of contador.entries())
        formateados.push({name:estados[aux[0]], value:aux[1]})

    return res.json(formateados);
});

router.get("/envios", async (req, res) => {
    const envioIds = await redisClient.sMembers('problema:problema1:envios');
    return res.json({ "value": envioIds.length, "description": "Envios realizados" });
});

router.get("/tiempoMedio", async (req, res) => {
    const [totalTiempoStr, totalEnviosStr] = await redisClient.hmGet("problema:problema1", ["totalTiempo", "totalEnvios"]);

    const totalTiempo = Number(totalTiempoStr) || 0;
    const totalEnvios = Number(totalEnviosStr) || 0;
    if (totalEnvios === 0) {
        return res.json({ value: 0, description: "Tiempo medio"});
    }

    const tiempoMedio = totalTiempo / totalEnvios;
    return res.json({ value: tiempoMedio.toFixed(4), description: "Tiempo medio" });
});

router.get("/tiempoMin", async(req, res) => {
    const tiempoMin = await redisClient.hmGet("problema:problema1", "tiempoMin");
    return res.json({value: Number(tiempoMin).toFixed(4), description: "Tiempo minimo"});
})

export default router;