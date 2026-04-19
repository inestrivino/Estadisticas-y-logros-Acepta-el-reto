import express from 'express';
import gestionDAO from '../dao/gestionDAO.js';
const router = express.Router();

router.get("/porcentajeCarga", async (_req, res) => {
    return res.json(await gestionDAO.getPorcentajeCarga());
});

export default router;
