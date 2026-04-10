import UsuarioDAO from "../../dao/usuarioDAO.js";
import ProblemaDAO from "../../dao/problemaDAO.js";
import { Logro, NivelLogro, CategoriaLogro } from "../../types/logro.js";

const DAOUsuario = new UsuarioDAO();
const DAOProblema = new ProblemaDAO();

// TODO poner esto de otra manera
const CATEGORIAS_PROBLEMAS = ["construccion de programacion", "estructuras de datos", "algoritmia", "matematicas", "grafos", "geometria"];
const NUM_CATEGORIAS = CATEGORIAS_PROBLEMAS.length;


export const logros: Logro[] = [
  {
    id: 1,
    nombre: "logro1",
    descripcion: "Creación de una cuenta",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.BRONCE,
    categoria: CategoriaLogro.ONBOARDING,
    sorpresa: false,
    trigger: "siempre",
    condicionCargaInicial: (estado) => true,
    condicion: async (envio) => true
  },
  {
    id: 1,
    nombre: "logro2",
    descripcion: "Realización del primer envío",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.BRONCE,
    categoria: CategoriaLogro.ONBOARDING,
    sorpresa: false,
    trigger: "siempre",

    condicionCargaInicial: (estado) => estado.numEnvios > 0,

    condicion: async (envio) => {
      const envios = await DAOUsuario.getNumEnvios(envio.usuario);
      return envios === 1;
    }
  },
  {
    id: 1,
    nombre: "logro4",
    descripcion: "Resolución de 10 problemas",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.BRONCE,
    categoria: CategoriaLogro.PROBLEMAS,
    sorpresa: false,
    trigger: "AC",

    condicionCargaInicial: (estado) => {
      return estado.numProblemasResueltos >= 10
    },

    condicion: async (envio) => {
      const numProblemasResueltos = await DAOUsuario.getNumProblemasResueltos(envio.usuario);
      return numProblemasResueltos === 10;
    }
  },
  {
    id: 1,
    nombre: "logro5",
    descripcion: "Resolución de 50 problemas",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.PLATA,
    categoria: CategoriaLogro.PROBLEMAS,
    sorpresa: false,
    trigger: "AC",

    condicionCargaInicial: (estado) => estado.numProblemasResueltos >= 50,

    condicion: async (envio) => {
      const numProblemasResueltos = await DAOUsuario.getNumProblemasResueltos(envio.usuario);
      return numProblemasResueltos === 50;
    }
  },
  {
    id: 1,
    nombre: "logro6",
    descripcion: "Resolución de 100 problemas",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.PLATA,
    categoria: CategoriaLogro.PROBLEMAS,
    sorpresa: false,
    trigger: "AC",

    condicionCargaInicial: (estado) => estado.numProblemasResueltos >= 100,

    condicion: async (envio) => {
      const numProblemasResueltos = await DAOUsuario.getNumProblemasResueltos(envio.usuario);
      return numProblemasResueltos === 100;
    }
  },
  {
    id: 1,
    nombre: "logro7",
    descripcion: "Resolución de 500 problemas",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.ORO,
    categoria: CategoriaLogro.PROBLEMAS,
    sorpresa: false,
    trigger: "AC",

    condicionCargaInicial: (estado) => estado.numProblemasResueltos >= 500,

    condicion: async (envio) => {
      const numProblemasResueltos = await DAOUsuario.getNumProblemasResueltos(envio.usuario);
      return numProblemasResueltos === 500;
    }
  },
  {
    id: 1,
    nombre: "logro8",
    descripcion: "Resolución de 25 problemas en C",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.ORO,
    categoria: CategoriaLogro.LENGUAJES,
    sorpresa: false,
    trigger: "AC",

    condicionCargaInicial: (estado) => (estado.lenguajesProblemasResueltos.get("c") ?? 0) >= 25,

    condicion: async (envio) => {
      const numProblemas = await DAOUsuario.getNumProblemasLenguaje(envio.usuario, "c");
      return numProblemas === 25;
    }
  },
  {
    id: 1,
    nombre: "logro9",
    descripcion: "Resolución de 25 problemas en C++",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.ORO,
    categoria: CategoriaLogro.LENGUAJES,
    sorpresa: false,
    trigger: "AC",

    condicionCargaInicial: (estado) => (estado.lenguajesProblemasResueltos.get("cpp") ?? 0) >= 25,

    condicion: async (envio) => {
      const numProblemas = await DAOUsuario.getNumProblemasLenguaje(envio.usuario, "cpp");
      return numProblemas === 25;
    }
  },
  {
    id: 1,
    nombre: "logro10",
    descripcion: "Resolución de 25 problemas en Java",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.ORO,
    categoria: CategoriaLogro.LENGUAJES,
    sorpresa: false,
    trigger: "AC",

    condicionCargaInicial: (estado) => (estado.lenguajesProblemasResueltos.get("java") ?? 0) >= 25,

    condicion: async (envio) => {
      const numProblemas = await DAOUsuario.getNumProblemasLenguaje(envio.usuario, "java");
      return numProblemas === 25;
    }
  },
  {
    id: 1,
    nombre: "logro11",
    descripcion: "Haber realizado envíos con 3 lenguajes diferentes",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.PLATA,
    categoria: CategoriaLogro.LENGUAJES,
    sorpresa: false,
    trigger: "siempre",

    condicionCargaInicial: (estado) => estado.lenguajes.size >= 3,

    condicion: async (envio) => {
      const numLenguajes = await DAOUsuario.getNumLenguajesUsados(envio.usuario);
      return numLenguajes === 3;
    }
  },
  {
    id: 1,
    nombre: "logro12",
    descripcion: "Consecución de una racha de 5 envíos aceptados a la primera",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.ORO,
    categoria: CategoriaLogro.RACHAS,
    sorpresa: false,
    trigger: "AC",
    
    condicionCargaInicial: (estado) => false, 

    condicion: async (envio) => {
      const racha = await DAOUsuario.getRachaMaximaEnviosCorrectos(envio.usuario);
      return racha === 5;
    }
  },
  {
    id: 1,
    nombre: "logro13",
    descripcion: "Realización de envíos en 7 días consecutivos",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.BRONCE,
    categoria: CategoriaLogro.RACHAS,
    sorpresa: false,
    trigger: "siempre",

    condicionCargaInicial: (estado) => (estado.rachaDiasEnvioMax ?? 0) >= 7,

    condicion: async (envio) => {
      const racha = await DAOUsuario.getRachaMaximaDiasConEnvio(envio.usuario);
      return racha === 7;
    }
  },
  {
    id: 1,
    nombre: "logro14",
    descripcion: "Resolución de un problema en el primer intento",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.BRONCE,
    categoria: CategoriaLogro.CALIDAD,
    sorpresa: false,
    trigger: "AC",

    condicionCargaInicial: (estado) => false, //TODO no esta hecho

    condicion: async (envio) => {
      const tieneEnvioIncorrecto = await DAOUsuario.tieneProblemaEnvioIncorrecto(envio.usuario, envio.problema);
      return !tieneEnvioIncorrecto;
    }
  },
  {
    id: 1,
    nombre: "logro15",
    descripcion: "Envío correcto dentro del 25% de soluciones más rápidas para un problema",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.PLATA,
    categoria: CategoriaLogro.CALIDAD,
    sorpresa: false,
    trigger: "AC",

    condicionCargaInicial: (estado) => false, //TODO no esta hecho

    condicion: async (envio) => {
      const rank = await DAOProblema.getRankEnvioProblema(envio.problema, envio.envioId);
      const numAC = await DAOProblema.getNumEnviosAC(envio.problema);
      if (rank === -1 || numAC === 0) 
        return false;
      return rank < numAC * 0.25;
    }
  },
  /* //TODO categorias problemas
  {
    id: 1,
    nombre: "logro16",
    descripcion: "Resolución de un problema de cada categoría",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.ORO,
    categoria: CategoriaLogro.CATEGORIAS,
    sorpresa: false,
    trigger: "AC",

    condicionCargaInicial: (estado) => estado.categoriaProblemasResueltos.size === NUM_CATEGORIAS,

    condicion: async (envio) => {
      const numCategorias = await DAOUsuario.getNumCategoriasProblemasResueltos(envio.usuario);
      return numCategorias === NUM_CATEGORIAS;
    }
  },
  */
  {
    id: 1,
    nombre: "logro17",
    descripcion: "Envío correcto que iguale o mejore el tiempo de ejecución récord para un problema",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.ORO,
    categoria: CategoriaLogro.CALIDAD,
    sorpresa: true,
    trigger: "AC",

    condicionCargaInicial: (estado) => false, //Se comprueba en tiempo real

    condicion: async (envio) => {
      const mejorTiempo = await DAOProblema.getMejorTiempo(envio.problema);
      return envio.tiempo <= mejorTiempo;
    }
  },
  {
    id: 1,
    nombre: "logro18",
    descripcion: "Realización de envíos en cada franja horaria",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.PLATA,
    categoria: CategoriaLogro.RACHAS,
    sorpresa: true,
    trigger: "siempre",

    condicionCargaInicial: (estado) => estado.franjasHorarias.size === 24,

    condicion: async (envio) => {
      const numFranjasHorarias = await DAOUsuario.getNumFranjasHorariasConEnvio(envio.usuario);
      return numFranjasHorarias === 24;
    }
  },
  {
    id: 1,
    nombre: "logro3",
    descripcion: "Obtención de 5 logros",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.PLATA,
    categoria: CategoriaLogro.ONBOARDING,
    sorpresa: false,
    trigger: "siempre",

    condicionCargaInicial: (estado) => estado.logros.size >= 5,
    condicion: async (envio) => false
  }
];

export default logros;