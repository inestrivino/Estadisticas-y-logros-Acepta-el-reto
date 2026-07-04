# Estadísticas y logros para el juez online '¡Acepta el Reto!'

![Estado de tests](https://github.com/inestrivino/Estadisticas-y-logros-Acepta-el-reto/actions/workflows/ci.yml/badge.svg)
[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/inestrivino/Estadisticas-y-logros-Acepta-el-reto/blob/main/README.en.md)


Índice:

- [Estadísticas y logros para el juez online '¡Acepta el Reto!'](#estadísticas-y-logros-para-el-juez-online-acepta-el-reto)
  - [Introducción](#introducción)
  - [Estructura del proyecto](#estructura-del-proyecto)
  - [Instalación y desarrollo](#instalación-y-desarrollo)

## Introducción

El Panel de Estadísticas y Logros para el juez online '¡Acepta el Reto!' es una aplicación web (React, Node.js) desarrollada para el Trabajo de Fin de Grado de Ingeniería de Software en la [Universidad Complutense de Madrid](ucm.es). Fue desarrollado por Néstor García Mayor, María Pajares Vázquez e Inés Triviño Rello bajo la dirección de los tutores Pedro Pablo Gómez Martín y Marco Antonio Gómez Martín.

El objetivo de este panel es guiar a los usuarios de ¡Acepta el Reto! en su progreso en el sistema y de manera más general, en su progreso en el campo de la programación competitiva. Para ello se implementó un sistema simple de gamificación con puntos de experiencia y logros.

Una versión desplegada de la aplicación se encuentra disponible aquí: [https://dashboard.aceptaelreto.com/](https://dashboard.aceptaelreto.com/).

![Imagen de estadísticas de un ejercicio](ejercicio.png)
![Imagen de logros de un usuario](logros.png)
![Imagen de la tabla de ránking](ranking.png)

## Estructura del proyecto

El repositorio del proyecto está dividido en dos carpetas principales:

- **Memoria**: Contiene los archivos LaTeX usados para crear la memoria del proyecto, archivos de compilación en LaTeX, y algo de información. La estructura está basada en la plantilla proporcionada por la Universidad Complutense, que puede encontrarse [aquí](https://informatica.ucm.es/file/plantilla_tfg_latex?ver), con su respectiva información de licencia y compilación. La memoria compilada usa una licencia CC-BY-SA. Las imágenes originales desarrolladas para este proyecto (las imágenes de los logros) fueron creadas usando LibreSprite se les aplica la misma licencia que a la memoria compilada del proyecto.
- **Aplicación**: Contiene los archivos referidos a la aplicación en sí misma. Esto incluye el código de los adaptadores, el backend y frontend de la apliación, elementos compartidos, entornos virtuales, contenedores Docker, la licencia del código, etc.

## Instalación y desarrollo

Para desarrollar la aplicación son necesarias las siguientes dependencias:

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

2. En la terminal, entra a la carpeta `Aplicacion` y ejecuta el siguiente comando, tras haberse asegurado de instalar las dependencias en todas las capas de la aplicación con `npm install`:

```bash
npm start
```

3. Una vez hayas lanzado la aplicación puedes abrir un navegador y dirigirte a `http://localhost:3000/` para probarla por ti mismo.

4. Una vez la aplicación esté lanzada se puede adjuntar el debug desde VSCode (Adjuntar debugger).

Ahora ya estás preparado para realizar cambios sobre la aplicación. Para cerrarla bastará con hacer un `Ctrl+C` en la terminal desde la que se lanzó. Luego usar el comando `docker ps` o similar para comprobar que el contenedor no sigue activo.

Para el desarrollo de la Memoria se recomienda leer la guía `Gestionar LaTeX.txt` en la carpeta `Memoria`, que da indicaciones sobre cómo manejar un proyecto LaTeX, e incluye los scripts `compilar_latex.sh/.bat` para generar el pdf correspondiente de manera local. Sin embargo, son solo ayudas, se puede desarrollar de muchas maneras válidas (por ejemplo: en la nube usando una herramienta como Overleaf, y al terminar los cambios, descargar y adjuntar al repositorio los archivos correspondientes).