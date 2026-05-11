
import cron from 'node-cron';
import usuarioDAO from '../dao/usuarioDAO.js';


export default function activarCron() {
    /*
    cron.schedule('* * * * *', async () => {
        const hoy = new Date;
        hoy.setHours(0, 0, 0, 0);
        const timeStamp = hoy.valueOf();
        const haceUnAnio = timeStamp - 365 * 24 * 60 * 60;

        usuarioDAO.eliminarEnviosDia(haceUnAnio);
    });

    cron.schedule('* * * * *', async () => {
        console.log('Prueba');
    });
    */
}