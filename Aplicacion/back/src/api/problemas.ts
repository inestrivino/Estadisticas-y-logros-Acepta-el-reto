import express from 'express';
import problemaDAO from '../dao/problemaDAO.js';

const router = express.Router();

router.get("/:problema/envios", async (req, res) => {
    const { problema } = req.params;
    return res.json(await problemaDAO.getNumEnvios(problema));
});

router.get("/:problema/mejorTiempo", async(req, res) => {
    const { problema } = req.params;
    return res.json(await problemaDAO.getMejorTiempo(problema));
})

router.get("/:problema/tiempoPromedio", async (req, res) => {
    const { problema } = req.params;
    return res.json(await problemaDAO.getTiempoPromedio(problema));
});

router.get("/:problema/resultados", async (req, res) => {
    const { problema } = req.params;
    return res.json(await problemaDAO.getResultados(problema));
});

router.get("/:problema/lenguajes", async (req, res) => {
    const { problema } = req.params;
    return res.json(await problemaDAO.getLenguajes(problema));
});

export default router;