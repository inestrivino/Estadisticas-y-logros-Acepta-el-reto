import fs from "fs";

const resultados = ["AC","PE","WA","CE","RTE","TLE","MLE","OLE","RF","IQ","IE"];
const lenguajes = ["c", "cpp", "java", "python", "js"];
const usuarios = Array.from({ length: 50 }, (_, i) => `user${i+1}`);
const problemas = Array.from({ length: 20 }, (_, i) => `problema${i+1}`);

const envios = [];

for (let i = 1; i <= 1000000; i++) {
  const envio = {
    usuario: usuarios[Math.floor(Math.random() * usuarios.length)],
    problema: problemas[Math.floor(Math.random() * problemas.length)],
    resultado: resultados[Math.floor(Math.random() * resultados.length)],
    lenguaje: lenguajes[Math.floor(Math.random() * lenguajes.length)],
    tiempo: +(Math.random() * 2).toFixed(3),
    memoria: Math.floor(500 + Math.random() * 4000),
    pos: Math.floor(1 + Math.random() * 100),
    fecha: new Date(
      2024,
      Math.floor(Math.random() * 12),
      Math.floor(1 + Math.random() * 28)
    ).toISOString().split("T")[0]
  };

  envios.push(envio);
}
fs.mkdirSync("back/data", { recursive: true });
fs.writeFileSync("back/data/envios.json", JSON.stringify(envios, null, 2));