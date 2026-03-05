import redisClient from '../redis/redisClient.js';
import express from 'express';
const router = express.Router();

router.get("/:problema/envios", async (req, res) => {
    const { problema } = req.params;
    const numEnvios:number = Number(await redisClient.get(`problema:${problema}:envios`));

    return res.json(numEnvios);
});

router.get("/:problema/mejorTiempo", async(req, res) => {
    const { problema } = req.params;
    const tiempoMinStr = await redisClient.get(`problema:${problema}:mejorTiempo`);

    const tiempoMin = tiempoMinStr ? Number(tiempoMinStr) : null;   
    return res.json(tiempoMin);
})

router.get("/:problema/tiempoPromedio", async (req, res) => {
    const { problema } = req.params;
    const numEnvios:number = Number(await redisClient.get(`problema:${problema}:aciertos`));
    const tiempoTotal:number = Number(await redisClient.get(`problema:${problema}:tiempoTotal`));

    const tiempoMedio = numEnvios > 0 ? tiempoTotal / numEnvios : 0;
    return res.json(tiempoMedio);
});

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

export default router;