export type EnvioSinProcesarEvent = {
    envio: {
        nick: string,
        uid: number,
        ver: string,
        mem: number,
        sbt: number,
        lan: string,
        name: string,
        rank: number,
        pid: number,
        run: number,
        sid: number
    },
    problema: {
        num: number,
        title: string,
        volume: {
            id: number,
            name: string,
        }
        totalSubs: number,
        totalUsers: number,
        ac: number,
        dacu: number
        pe: number,
        wa: number,
        tl: number,
        ml: number,
        ol: number,
        rf: number,
        rte: number,
        ce: number,
        ir: number,
        c: number,
        cpp: number,
        java: number,
    }
};