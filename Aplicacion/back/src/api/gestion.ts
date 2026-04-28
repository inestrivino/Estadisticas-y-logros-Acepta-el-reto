import express from 'express';
import gestionDAO from '../dao/gestionDAO.js';
const router = express.Router();

router.get("/porcentajeCarga", async (_req, res) => {
const aux = await gestionDAO.getPorcentajeCarga();
    return res.json(aux);
});

export default router;
