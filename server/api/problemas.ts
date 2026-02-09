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

    const contador: Record<string, number> = {};

    for (const dato of datos) {
        const key = String(dato);

        //si no existe la clave se inicializa a 0 y suma 1
        contador[key] = (contador[key] ?? 0) + 1;
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

    const formateados = Object.entries(contador).map(([name, value]) => ({
        name: estados[name],
        value,
    }));

    return res.json(formateados);
});

export default router;