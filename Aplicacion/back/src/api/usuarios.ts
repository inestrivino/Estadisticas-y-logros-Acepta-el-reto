import express from 'express';
import UsuarioDAO from 'src/dao/usuarioDAO.js';

const usuarioDAO = new UsuarioDAO();
const router = express.Router();

router.get("/:usuario/resultados", async (req, res) => {
    const { usuario } = req.params;
    return res.json(await usuarioDAO.getResultados(usuario));
});

router.get("/:usuario/lenguajes", async (req, res) => {
    const { usuario } = req.params;
    return res.json(await usuarioDAO.getLenguajes(usuario));
});

router.get("/:usuario/enviosAnio", async (req, res) => {
    //se saca el usuario del que se quiere hacer la consulta
    const { usuario } = req.params;

    //se saca el timeStamp del inicio del dia en el que se hizo la consulta
    const hoy = new Date;
    hoy.setHours(0, 0, 0, 0);
    const timeFin = hoy.valueOf() / 1000;

    const timeIni = timeFin - 364 * 24 * 60 * 60;

    const datos = await usuarioDAO.getEnviosUsuario(usuario, timeIni, timeFin);

    return res.json(datos);
});

export default router;