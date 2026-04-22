import express from 'express';
import problemaService from '../servicios/problemaService.js';

const router = express.Router();

router.get("/:problema/envios", async (req, res) => {
    const { problema } = req.params;
    return res.json(await problemaService.getNumEnvios(problema));
});

router.get("/:problema/mejorTiempo", async(req, res) => {
    const { problema } = req.params;
    return res.json(await problemaService.getMejorTiempo(problema));
})

router.get("/:problema/tiempoPromedio", async (req, res) => {
    const { problema } = req.params;
    return res.json(await problemaService.getTiempoPromedio(problema));
});

router.get("/:problema/resultados", async (req, res) => {
    const { problema } = req.params;
    return res.json(await problemaService.getResultados(problema));
});

router.get("/:problema/lenguajes", async (req, res) => {
    const { problema } = req.params;
    return res.json(await problemaService.getLenguajes(problema));
});

export default router;
