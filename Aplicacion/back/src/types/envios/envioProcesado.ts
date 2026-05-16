export type EnvioProcesado = {
    envioId: number,        //id unico del envio
    usuario: string,        //identificador del usuario que hizo el envio
    problema: string,       //identificador del problema enviado
    //categoria: string,    //TODO categorias problemas
    resultado: string,      //veredicto del juez (AC, WA, TLE, ...)
    lenguaje: string,       //lenguaje de programacion usado
    tiempo: number,         //tiempo de ejecucion en milisegundos
    memoria: number,        //memoria usada en kilobytes
    pos: number,            //posicion del envio dentro del problema
    fecha: number,          //timestamp en segundos
    hora: number,           //hora UTC del envio (0-23)
    mes: number             //mes UTC del envio (0-11)
};