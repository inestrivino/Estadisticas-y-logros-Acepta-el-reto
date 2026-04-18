import { Logro, NivelLogro, CategoriaLogro } from "../../../types/logro.js";

export const logrosRachas: Logro[] = [
  {
    id: 1,
    nombre: "logro12",
    descripcion: "Consecución de una racha de 5 envíos aceptados a la primera",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.ORO,
    categoria: CategoriaLogro.RACHAS,
    sorpresa: false,

    enTiempoReal: true,

    condicion: (estadoUsuario, estadoProblema, envio) => (estadoUsuario.rachaEnviosAC ?? 0) >= 5
  },
  {
    id: 1,
    nombre: "logro13",
    descripcion: "Realización de envíos en 7 días consecutivos",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.BRONCE,
    categoria: CategoriaLogro.RACHAS,
    sorpresa: false,
    
    enTiempoReal: true,

    condicion: (estadoUsuario, estadoProblema, envio) => (estadoUsuario.rachaDiasEnvio ?? 0) >= 7
  },
  {
    id: 1,
    nombre: "logro18",
    descripcion: "Realización de envíos en cada hora del día",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.PLATA,
    categoria: CategoriaLogro.RACHAS,
    sorpresa: true,
    
    enTiempoReal: false,

    condicion: (estadoUsuario, estadoProblema, envio) => estadoUsuario.horas.size === 24
  }
];
