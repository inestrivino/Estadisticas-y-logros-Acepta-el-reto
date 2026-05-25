import { datosXP } from '../types/datos/datosXP.js';
import DAO from './DAO.js'

class XPDAO extends DAO {

    /**
     * Incrementa la XP de cada usuario del bloque en el ranking global.
     * @param datos - Array de pares usuario/xp a acumular.
     */
    async registrarBloqueXP(datos: datosXP[]) {
        const pipeline = this.redis.multi();
        for (const { usuario, xp } of datos) {
            pipeline.zIncrBy(`usuario:ranking`, xp, usuario);
        }
        await pipeline.exec();
    }

    /**
     * Incrementa la XP de cada usuario del bloque en el ranking del mes indicado.
     * @param mes - Mes (0-11) al que pertenece el bloque.
     * @param datos - Array de pares usuario/xp a acumular.
     */
    async registrarBloqueXPMes(datos:{mes: number, puntos: datosXP[]}[]) {
        const pipeline = this.redis.multi();
        for (const { mes, puntos } of datos) {
            for (const { usuario, xp } of puntos) {
                pipeline.zIncrBy(`usuario:ranking:mes:${mes}`, xp, usuario);
            }
        }
        await pipeline.exec();
    }

    /**
     * Sobrescribe el ranking global de XP con los valores indicados,
     * eliminando el contenido anterior.
     * @param datos - Array de pares usuario/xp a fijar como valor exacto en el ranking.
     */
    async setRankingGlobal(datos: datosXP[]) {
        const pipeline = this.redis.multi();
        pipeline.del(`usuario:ranking`);
        if (datos.length > 0)
            pipeline.zAdd(`usuario:ranking`, datos.map(({ usuario, xp }) => ({ score: xp, value: usuario })));
        await pipeline.exec();
    }

    /**
     * Sobrescribe el ranking de XP del mes indicado con los valores indicados,
     * eliminando el contenido anterior de ese mes.
     * @param mes - Mes (0-11) cuyo ranking se va a sobrescribir.
     * @param datos - Array de pares usuario/xp a fijar como valor exacto en el ranking del mes.
     */
    async setRankingMes(mes: number, datos: datosXP[]) {
        const pipeline = this.redis.multi();
        pipeline.del(`usuario:ranking:mes:${mes}`);
        if (datos.length > 0)
            pipeline.zAdd(`usuario:ranking:mes:${mes}`, datos.map(({ usuario, xp }) => ({ score: xp, value: usuario })));
        await pipeline.exec();
    }

    /**
     * Pone a 0 la XP de todos los usuarios del ranking.
     */
    async resetearXP() {
        const pipeline = this.redis.multi();
        pipeline.del(`usuario:ranking`);
        for (let i = 0; i < 12; i++)
            pipeline.del(`usuario:ranking:mes:${i}`);
        await pipeline.exec();
    }

    /**
     * Borra el ranking de XP de un mes concreto.
     * @param mes - Mes (0-11) cuyo ranking se va a borrar.
     */
    async borrarRankingMes(mes: number): Promise<void> {
        await this.redis.del(`usuario:ranking:mes:${mes}`);
    }

    //============================== CONSULTAS ==============================

    /**
     * Devuelve los usuarios que se encuentran entre las posiciones ini y fin del ranking.
     * @param ini - Posicion inicial del rango.
     * @param fin - Posicion final del rango.
     * @returns Array con el nombre y el xp de los usuarios que se encuentran entre esas posiciones en el ranking global.
     */
    async getUsuariosRankingPorRango(ini: number, fin: number): Promise<{ value: string; score: number }[]> {
        const usuarios = await this.redis.zRangeWithScores(`usuario:ranking`, ini, fin, { REV: true });
        return usuarios;
    }

    /**
     * Devuelve los usuarios del nivel correspondiente al rango de xp [iniNivel, finNivel] que se encuentran entre
     * las posiciones ini y fin (dentro del propio nivel)
     * @param ini - Posicion inicial del rango (dentro del nivel).
     * @param fin - Posicion final del rango (dentro del nivel).
     * @param iniNivel - Valor de XP (score dentro del haz) que marca el limite inicial del nivel del que queremos devolver los usuarios.
     * @param finNivel - Valor de XP (score dentro del haz) que marca el limite final del nivel del que queremos devolver los usuarios.
     * @returns Array con el nombre y el xp de los usuarios que se encuentran entre esas posiciones en el ranking del nivel correspondiente.
     */
    async getUsuariosRankingPorRangoYNivel(ini: number, fin: number, iniNivel: number, finNivel: number):
        Promise<{ value: string; score: number }[]> {

        const usuarios = await this.redis.zRangeWithScores(`usuario:ranking`, finNivel, iniNivel,
            { BY: 'SCORE', REV: true, LIMIT: { offset: ini, count: fin - ini + 1, } }
        );

        return (usuarios ?? []) as { value: string; score: number }[];
    }

    /**
     * Devuelve la posicion de usuario en el ranking de xp.
     * @param usuario - Identificador del usuario.
     * @returns Entero > 0 en caso de estar el usuario en el ranking o -1 en caso de no estar.
     */
    async getPosUsuarioEnRanking(usuario: string): Promise<number> {
        const pos = await this.redis.zRevRank(`usuario:ranking`, usuario);
        return pos !== null ? pos + 1 : -1;
    }

    /**
     * Devuelve el numero de usuarios que hay en el ranking.
     * @returns Entero >= 0 que indica el numero de usuario en el ranking.
     */
    async getNumUsuarios(): Promise<number> {
        const numUsuarios = await this.redis.zCard(`usuario:ranking`);
        return numUsuarios;
    }

    /**
     * Devuelve la cantidad de usuarios que tengan XP entre ini y fin.
     * @param ini - Valor de XP que representa el limite inicial del rango, correspondiente al score en el haz.
     * @param fin - Valor de XP que representa el limite final del rango, correspondiente al score en el haz.
     * @returns Numero de usuarios que cumplan la condicion >= 0.
     */
    async getNumUsuariosEnRango(ini: number, fin: number): Promise<number> {
        const numUsuarios = await this.redis.zCount(`usuario:ranking`, ini, fin);
        return numUsuarios;
    }

    /**
     * Devuelve la cantidad de xp que tiene usuario.
     * @param usuario - Identificador del usuario.
     * @returns Entero > 0 si existe el usuario en el ranking, o -1 en caso de no estar.
     */
    async getXPUsuario(usuario: string): Promise<number> {
        const xp = await this.redis.zScore(`usuario:ranking`, usuario);
        return xp !== null ? xp : -1
    }

    /**
     * Devuelve la XP acumulada por el usuario en cada mes (0-11).
     * @param usuario - Identificador del usuario.
     * @returns Array de 12 entradas con el mes (0-11) y su XP (0 si no tiene datos).
     */
    async getXPUsuarioPorMes(usuario: string): Promise<{ mes: number, xp: number }[]> {
        const pipeline = this.redis.multi();
        for (let mes = 0; mes < 12; mes++) {
            pipeline.zScore(`usuario:ranking:mes:${mes}`, usuario);
        }
        const resultados = await pipeline.exec();
        return resultados.map((xp, mes) => ({ mes, xp: Number(xp) ?? 0 }));
    }
}

export default new XPDAO();