# Estadísticas y logros para el juez '¡Acepta el Reto!'

Índice:

- [Estadísticas y logros para el juez '¡Acepta el Reto!'](#estadísticas-y-logros-para-el-juez-acepta-el-reto)
  - [Funciones principales](#funciones-principales)
  - [Capturas de pantalla](#capturas-de-pantalla)
  - [Instalación y desarrollo](#instalación-y-desarrollo)

## Funciones principales

## Capturas de pantalla

## Instalación y desarrollo

Para desarrollar la aplicación necesitarás las siguientes dependencias:

- [Docker](https://docs.docker.com/get-started/get-docker/), incluyendo el plugin Docker Compose
- [Node.js](https://nodejs.org/en/download) con npm

Puedes comprobar si tienes las dependencias instaladas ejecutando los comandos:

```bash
docker -v
docker compose version
node -v
npm --version
```

Si alguno de estos comandos devuelve un error diciendo que no se pudo encontrar la orden, repasa tu instalación.

Cuando estés preparado, sigue estos pasos:

1. Comienza por clonar el repositorio en tu máquina:

```bash
git clone https://github.com/inestrivino/Estadisticas-y-logros-Acepta-el-reto
```

2. En la terminal, entra a la carpeta `Aplicacion` y ejecuta los siguientes comandos:

Para descargar los módulos node correspondientes:

```bash
npm ci
```

Para crear la base de datos local:

```bash
npm run casos
```

Para lanzar la aplicación:

```bash
npm run start
```

3. Una vez hayas lanzado la aplicación puedes abrir un navegador y dirigirte a `http://localhost3000/` para probarla por ti mismo.

4. Una vea la aplicacion este lanzada se puede adjuntar el debug desde VSCode (Adjuntar debugger).

Ahora ya estás preparado para realizar cambios sobre la aplicación. Para cerrarla bastará con hacer un `Ctrl+C` en la terminal desde la que se lanzó. Luego usar el comando `docker ps` o similar para comprobar que el contenedor no sigue activo.

Para el desarrollo de la Memoria se recomienda leer la guía `Gestionar LaTeX.txt` en la carpeta `Memoria`, que da indicaciones sobre cómo manejar un proyecto LaTeX, e incluye los scripts `compilar_latex.sh/.bat` para generar el pdf correspondiente todo de manera local. Sin embargo, son solo ayudas, se puede desarrollar de muchas maneras válidas (por ejemplo: en la nube con una herramienta como Overleaf y descargar el fichero o ficheros correspondientes de vuelta al repositorio al terminar los cambios).
