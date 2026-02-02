import { task } from "just-scripts";
import chokidar from "chokidar";
import { build } from "esbuild";
import { ChildProcess, exec } from "child_process";
import { rimraf } from "rimraf";
import fs from "fs/promises"; //con esto para que funcione en windows y linux

// Variable para controlar el proceso del servidor
let serverProcess: ChildProcess;

// Funciones de build (no tareas aún)
async function cleanTask() {
  await rimraf("dist-server");
  console.log(" * Carpeta dist limpiada");
}

async function buildTask() {  
  await build({
    entryPoints: ["./src/server.ts"],
    bundle: true,
    platform: "node",
    target: "node22",
    outfile: "./dist-server/server.js",
    sourcemap: true,
    external: ["express", "redis"],
    minify: false,
  });
  
  console.log(" * Proyecto construido");
}

async function copyTask() {
  await fs.cp("public", "dist/public", { recursive: true });
  console.log(" * Archivos estaticos a dist");
}

async function startServer() {
  if (serverProcess) {
    console.log(" * Reiniciando servidor");
    serverProcess.kill();
  }
  
  console.log(" * Servidor iniciado");
  serverProcess = exec("node dist/server.js", (error, stdout, stderr) => {
    if (error && error.killed === false) {
      console.error(` * Error al iniciar el servidor: ${error}`);
    }
  });
}

async function startWatcher() {
  const watcher = chokidar.watch('src/', {
    //solo vigila archivos .ts
    ignored: (path, stats) => {
      if (!stats?.isFile()) 
        return false; 
      return !path.endsWith('.ts');
    },
    persistent: true,
  });

  watcher.on("ready", () => {
    console.log(" * Watcher listo y vigilando");
    //debug
    //let watchedPaths = watcher.getWatched();
    //console.log(" * Rutas vigiladas:", watchedPaths);
  });

  watcher.on("change", async (filePath) => {
    console.log(`\n* Cambio detectado en: ${filePath}`);
    try {
      await buildTask();
      await copyTask();
      //await startServer();
      console.log(" * Recarga completa\n");
    } catch (error) {
      console.error(" * Error en recarga:", error);
    }
  });

  watcher.on("error", (error) => {
    console.error(" * Error en watcher:", error);
  });

  process.on("SIGINT", () => {
    console.log("\n* Cerrando servidor");
    if (serverProcess) serverProcess.kill();
    watcher.close(); 
    process.exit(0);
  });
}

//funcion principal
task("local-deploy", async () => {  
  await cleanTask();
  await buildTask();
  //await copyTask();
  //await startServer();
  //await startWatcher();
});