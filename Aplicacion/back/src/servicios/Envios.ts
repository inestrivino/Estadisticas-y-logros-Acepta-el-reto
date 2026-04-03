export type Envio = {
    envioId: number,
    usuario: string,
    problema: string,
    categoria: string,
    resultado: string,
    lenguaje: string,
    tiempo: number,
    memoria: number,
    pos: number,
    fecha: string
};

export type EnvioProcesado = {
    envioId: number,
    usuario: string,
    problema: string,
    categoria: string,
    resultado: string,
    lenguaje: string,
    tiempo: number,
    memoria: number,
    pos: number,
    fecha: {
        dia: number,
        mes: number,
        anio: number,
        hora: number
    }
};
