#!/bin/bash

# Cambiar al directorio del proyecto
cd "Panel_de_estadísticas_y_logros_para_el_juez__Acepta_el_reto_" || {
    echo "Error: No se pudo acceder al directorio 'Panel_de_estadísticas_y_logros_para_el_juez__Acepta_el_reto_'."
    exit 1
}

# Compilar con pdflatex
echo "Compilando con pdflatex (1/3)..."
pdflatex main.tex || {
    echo "Error: Fallo en la primera compilación con pdflatex."
    exit 1
}

# Ejecutar bibtex
echo "Procesando referencias con bibtex..."
bibtex main.aux || {
    echo "Error: Fallo al ejecutar bibtex."
    exit 1
}

# Compilar con pdflatex (segunda vez)
echo "Compilando con pdflatex (2/3)..."
pdflatex main.tex || {
    echo "Error: Fallo en la segunda compilación con pdflatex."
    exit 1
}

# Compilar con pdflatex (tercera vez)
echo "Compilando con pdflatex (3/3)..."
pdflatex main.tex || {
    echo "Error: Fallo en la tercera compilación con pdflatex."
    exit 1
}

echo "Compilación completada con éxito. El documento 'main.pdf' debería estar listo."

