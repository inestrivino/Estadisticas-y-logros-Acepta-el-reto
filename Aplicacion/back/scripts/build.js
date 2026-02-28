import esbuild from "esbuild";
import { rimraf } from "rimraf";

async function cleanTask() {
  await rimraf("dist-server");
  console.log(" * Carpeta dist limpiada");
}

async function buildTask() {
  await esbuild.build({
    entryPoints: ["./src/server.ts"],
    bundle: true,
    platform: "node",
    target: "node22",
    outfile: "./dist-server/server.js",
    sourcemap: true,
    external: ["express", "redis", "shared"],
    minify: false,
  });

  console.log(" * Proyecto construido");
}

async function start() {
  await cleanTask();
  await buildTask();
}

start();