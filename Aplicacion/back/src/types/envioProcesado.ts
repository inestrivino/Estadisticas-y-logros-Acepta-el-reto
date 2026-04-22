export type EnvioProcesado = {
    envioId: number,
    usuario: string,
    problema: string,
    //categoria: string, //TODO categorias problemas
    resultado: string,
    lenguaje: string,
    tiempo: number,
    memoria: number,
    pos: number,
    fecha: number, //timestamp en segundos
    hora: number
};