import redisClient from '../redis/redisClient.js';
import express from 'express';
const router = express.Router();

router.get("/:problema/resultados", async (req, res) => {
    const { problema } = req.params;
    const datos = await redisClient.hGetAll(`problema:${problema}:resultados`);

    const formateados:{}[] = [];
    for (const aux of Object.entries(datos))
        formateados.push({name:aux[0], value:Number(aux[1])})

    formateados.sort((a:any, b:any) => a.name.localeCompare(b.name));

    return res.json(formateados);
});

router.get("/:problema/lenguajes", async (req, res) => {
    const { problema } = req.params;
    const datos = await redisClient.hGetAll(`problema:${problema}:lenguajes`);

    const formateados:{}[] = [];
    for (const aux of Object.entries(datos))
        formateados.push({name:aux[0], value:Number(aux[1])})

    formateados.sort((a:any, b:any) => a.name.localeCompare(b.name));

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