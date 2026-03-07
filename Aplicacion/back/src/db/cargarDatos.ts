import ProblemaDAO from "../dao/problemaDAO.js";

type Envio = {
    "usuario": string,
    "problema": string,
    "resultado": string,
    "lenguaje": string,
    "tiempo": number,
    "memoria": number,
    "pos": number,
    "fecha": string
};

type datosProblema = {
    "problema": string,
    "resultado": string,
    "lenguaje": string,
    "tiempo": number,
};

export async function procesarEnvio(envio: Envio) {
    const daoProblema = new ProblemaDAO();

    //informacion de los problemas
    await daoProblema.registrarEnvio({
        problema: envio.problema,
        resultado: envio.resultado,
        lenguaje: envio.lenguaje,
        tiempo: envio.tiempo
    });

    //informacion de los usuarios
    // . . .
}