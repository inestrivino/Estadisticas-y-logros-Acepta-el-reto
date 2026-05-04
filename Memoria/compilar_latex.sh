#!/bin/bash

# Obtenemos la carpeta donde está el script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Directorio objetivo absoluto
TARGET_DIR="$SCRIPT_DIR/Panel_de_estadisticas_y_logros_para_el_juez__Acepta_el_reto_"

echo "Directorio actual: $(pwd)"
echo "Directorio objetivo: $TARGET_DIR"

# Solo cambiar si no estamos ya ahí
if [ "$(pwd)" != "$TARGET_DIR" ]; then
    if cd "$TARGET_DIR"; then
        echo "Cambié al directorio: $(pwd)"
    else
        echo "Error: No se puede acceder al directorio '$TARGET_DIR'."
        exit 1
    fi
else
    echo "Ya estamos en el directorio: $(pwd)"
fi

# Limpiamos archivos auxiliares para evitar errores
echo "Cleaning auxiliary files..."
rm -f *.aux *.bbl *.blg *.log *.out *.toc *.lof *.lot *.lol *.fls *.fdb_latexmk *.synctex.gz

# Compilamos con pdflatex
echo "Compiling with pdflatex (1/4)..."
pdflatex -interaction=nonstopmode main.tex || {
    echo "Warning: First pdflatex compilation failed (may be normal if only warnings)."
}

# Ejecutamos bibtex
echo "Processing references with bibtex..."
bibtex main.aux || {
    echo "Error: bibtex failed."
    exit 1
}

# Compilamos con pdflatex nuevamente
echo "Compiling with pdflatex (2/4)..."
pdflatex -interaction=nonstopmode main.tex || {
    echo "Warning: Second pdflatex compilation failed (may be normal if only warnings)."
}

# Compilamos con pdflatex otra vez
echo "Compiling with pdflatex (3/4)..."
pdflatex -interaction=nonstopmode main.tex || {
    echo "Warning: Third pdflatex compilation failed (may be normal if only warnings)."
}

# Compilamos con pdflatex por última vez
echo "Compiling with pdflatex (4/4)..."
pdflatex -interaction=nonstopmode main.tex || {
    echo "Warning: Fourth pdflatex compilation failed (may be normal if only warnings)."
}

echo "Compilation complete. The 'main.pdf' document should be ready."