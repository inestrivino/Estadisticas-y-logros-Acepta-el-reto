import { Logro, NivelLogro, CategoriaLogro } from "../../../types/logro.js";

export const logrosOnboarding: Logro[] = [
  {
    id: 1,
    nombre: "logro1",
    descripcion: "Creación de una cuenta",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.BRONCE,
    categoria: CategoriaLogro.ONBOARDING,
    sorpresa: false,
    
    enTiempoReal: false,

    condicion: (estadoUsuario, estadoProblema, envio) => true
  },
  {
    id: 1,
    nombre: "logro2",
    descripcion: "Realización del primer envío",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.BRONCE,
    categoria: CategoriaLogro.ONBOARDING,
    sorpresa: false,
    
    enTiempoReal: false,

    condicion: (estadoUsuario, estadoProblema, envio) => estadoUsuario.numEnvios >= 1
  },
  {
    id: 1,
    nombre: "logro3",
    descripcion: "Obtención de 5 logros",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.PLATA,
    categoria: CategoriaLogro.ONBOARDING,
    sorpresa: false,
    
    enTiempoReal: false,

    condicion: (estadoUsuario, estadoProblema, envio) => estadoUsuario.logros.size >= 5
  }
];
