import { Logro, NivelLogro, CategoriaLogro } from "../../../types/logro.js";

export const logrosCalidad: Logro[] = [
  {
    id: 1,
    nombre: "logro14",
    descripcion: "Resolución de un problema en el primer intento",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.BRONCE,
    categoria: CategoriaLogro.CALIDAD,
    sorpresa: false,
   
    enTiempoReal: true,

    // se comprueba que el envio es AC y que el problema no tiene envios incorrectos previos
    condicion: (estadoUsuario, estadoProblema, envio) => envio!.resultado === "AC" && !estadoUsuario.problemasNoAC.has(envio!.problema)
  },
  {
    id: 1,
    nombre: "logro15",
    descripcion: "Envío correcto dentro del 25% de soluciones más rápidas para un problema que tenga al menos 100 envios",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.PLATA,
    categoria: CategoriaLogro.CALIDAD,
    sorpresa: false,
    
    enTiempoReal: true,
    
    condicion: (estadoUsuario, estadoProblema, envio) => {
      const esAcierto = envio!.resultado === "AC";
      const esRapido = estadoProblema!.posUltimoEnvio < Math.floor(0.25 * estadoProblema!.envios);
      const cienEnvios = estadoProblema!.envios >= 100;
      return esAcierto && esRapido && cienEnvios;
    }
  },
  {
    id: 1,
    nombre: "logro17",
    descripcion: "Envío correcto que iguale o mejore el tiempo de ejecución récord para un problema que tenga al menos 100 envios",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.ORO,
    categoria: CategoriaLogro.CALIDAD,
    sorpresa: true,
    
    enTiempoReal: true,

    // tras actualizarEstado el mejorTiempo del problema ya refleja este envio, asi que si lo igualo o mejoro se cumple
    condicion: (estadoUsuario, estadoProblema, envio) => {
      const esAcierto = envio!.resultado === "AC";
      const esMejorTiempo = envio!.tiempo <= (estadoProblema!.mejorTiempo ?? Infinity);
      const cienEnvios = estadoProblema!.envios >= 100;
      return esAcierto && esMejorTiempo && cienEnvios;
    }
  }
];
