import express from 'express';
import UsuarioService from '../servicios/usuarioService.js';

const usuarioService = new UsuarioService();
const router = express.Router();

router.get("/:usuario/resultados", async (req, res) => {
    const { usuario } = req.params;
    return res.json(await usuarioService.getResultados(usuario));
});

router.get("/:usuario/lenguajes", async (req, res) => {
    const { usuario } = req.params;
    return res.json(await usuarioService.getLenguajes(usuario));
});

router.get("/:usuario/enviosAnio", async (req, res) => {
    const { usuario } = req.params;
    const datos = await usuarioService.getEnviosAnio(usuario);
    return res.json(datos);
});

router.get("/:usuario/logros", async (req, res) => {
    const { usuario } = req.params;
    const { clasificacion } = req.query;
    return res.json(await usuarioService.getLogrosUsuario(usuario, clasificacion as string));
});

router.get("/ranking", async (req, res) => {
    const { pag, tam, nivel } = req.query;
    
    const usuarios = await usuarioService.getUsuariosRanking(Number(pag), Number(tam), (nivel !== undefined? String(nivel) : ""));
    const totalUsuarios = await usuarioService.getNumUsuarios((nivel !== undefined? String(nivel) : ""));
    return res.json({usuarios, totalUsuarios});
})

export default router;