import express from 'express';
import UsuarioDAO from '../dao/usuarioDAO.js';

const usuarioDAO = new UsuarioDAO();
const router = express.Router();

router.get("/:usuario/logros", async (req, res) => {
    const { usuario } = req.params;
    const {clasificacion} = req.query;
    return res.json(await usuarioDAO.getLogrosUsuario(usuario, clasificacion as string));
});

export default router;