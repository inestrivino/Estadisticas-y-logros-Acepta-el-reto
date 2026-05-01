import express from 'express';
import usuarioService from '../servicios/usuarios/estadisticasUsuarioBaseService.js';
import logrosService from '../servicios/logros/logrosService.js';
import xpService from '../servicios/xpService.js';
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
    return res.json(await logrosService.getLogrosUsuario(usuario, clasificacion as string));
});

router.get("/ranking", async (req, res) => {
    const { pag, tam, usuario } = req.query;
    const existeUsuario = usuario ? true : false;
    const usuarios = await xpService.getUsuariosRanking(Number(pag), Number(tam), existeUsuario , usuario ? String(usuario) : "");
    const totalUsuarios = await xpService.getNumUsuarios(existeUsuario, (usuario ? String(usuario) : ""));
    return res.json({ usuarios, totalUsuarios });
});

router.get("/:usuario/nivel", async (req, res) => {
    const { usuario } = req.params;
    const nivel = await xpService.getNivelUsuario(usuario);
    return res.json(nivel);
})

export default router;