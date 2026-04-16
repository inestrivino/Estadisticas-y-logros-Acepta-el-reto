import { EnvioProcesado } from "./envioSinProcesar.js";
import { EstadoUsuario } from "../servicios/estado/EstadoUsuario.js";

export enum NivelLogro {
  BRONCE = "Bronce",
  PLATA = "Plata",
  ORO = "Oro"
}

export enum CategoriaLogro {
  ONBOARDING = "Onboarding",
  PROBLEMAS = "Número de problemas",
  LENGUAJES = "Uso de lenguajes",
  RACHAS = "Rachas",
  CALIDAD = "Calidad",
  CATEGORIAS = "Categorías"
}

export type Logro = {
  id: number;
  nombre: string;
  descripcion: string;
  imagen: string;
  categoria: CategoriaLogro;
  nivel: NivelLogro;
  sorpresa: boolean;
  trigger: "siempre" | "AC",
  condicionCargaInicial: (estado: EstadoUsuario) => boolean;
  condicion: (envio: EnvioProcesado) => Promise<boolean>
};