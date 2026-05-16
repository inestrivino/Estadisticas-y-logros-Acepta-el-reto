import express from 'express';
import usuarioService from '../servicios/usuarioService.js';
import logrosService from '../servicios/logrosService.js';
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

router.get("/:usuario/logrosRecientes", async (req, res) => {
    const { usuario } = req.params;
    return res.json(await logrosService.getUltimosLogros(usuario));
});

router.get("/ranking", async (req, res) => {
    const { pag, tam, nivel } = req.query;
    const nivelStr = nivel ? String(nivel) : "";
    const usuarios = await xpService.getUsuariosRanking(Number(pag), Number(tam), nivelStr);
    const totalUsuarios = await xpService.getNumUsuarios(nivelStr);
    return res.json({ usuarios, totalUsuarios });
});

router.get("/:usuario/nivel", async (req, res) => {
    const { usuario } = req.params;
    const nivel = await xpService.getNivelUsuario(usuario);
    return res.json(nivel);
});

router.get("/ranking/:usuario", async (req, res) => {
    const { usuario } = req.params;
    const { filtrarNivel } = req.query;
    const filtrar = filtrarNivel === 'true';
    const info = await xpService.getInfoUsuarioRanking(usuario, filtrar);
    return res.json(info);
});

router.get("/:usuario", async (req, res) => {
    const { usuario } = req.params;
    const existe = await usuarioService.existeUsuario(usuario);
    return res.json({ existe });
})

router.get("/", async (req, res) => {
    const { patron } = req.query;
    if (patron) {
        const sugerencias = await usuarioService.getUsuariosSugeridos(String(patron));
        return res.json(sugerencias);
    } else {
        return res.json({});
    }
})

router.get("/:usuario/xpPorMes", async (req, res) => {
    const { usuario } = req.params;
    return res.json(await xpService.getXPUsuarioPorMes(usuario));
});

router.get("/:usuario/posRanking", async (req, res) => {
    const { usuario } = req.params;
    const pos = await xpService.getPosUsuarioEnRanking(usuario);
    return res.json(pos);
});

router.get("/:usuario/numEjerciciosResueltos", async (req, res) => {
    const { usuario } = req.params;
    const numEjs = (await usuarioService.getNumProblemasResueltos(usuario));
    return res.json(numEjs);
});

router.get("/:usuario/rachaActualEnvios", async (req, res) => {
    const { usuario } = req.params;
    const numEjs = await usuarioService.getRachaActualEnviosCorrectos(usuario);
    return res.json(numEjs);
});

router.get("/:usuario/rachaMaxEnvios", async (req, res) => {
    const { usuario } = req.params;
    const numEjs = await usuarioService.getRachaEnviosCorrectos(usuario);
    return res.json(numEjs);
});

router.get("/:usuario/rachaActualDias", async (req, res) => {
    const { usuario } = req.params;
    const racha = await usuarioService.getRachaActualDiasEnviosConsecutivos(usuario);
    return res.json(racha);
});

router.get("/:usuario/rachaMaxDias", async (req, res) => {
    const { usuario } = req.params;
    const racha = await usuarioService.getRachaDiasEnviosConsecutivos(usuario);
    return res.json(racha);
});

export default router;