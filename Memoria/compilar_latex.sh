#!/bin/bash

# Entra al directorio de trabajo en LaTeX de la memoria
cd "Panel_de_estadísticas_y_logros_para_el_juez__Acepta_el_reto_" || {
    echo "Error: Could not access directory 'Panel_de_estadísticas_y_logros_para_el_juez__Acepta_el_reto_'."
    exit 1
}

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

# Compilamos con pdflatex
echo "Compiling with pdflatex (2/4)..."
pdflatex -interaction=nonstopmode main.tex || {
    echo "Warning: Second pdflatex compilation failed (may be normal if only warnings)."
}

# Compilamos con pdflatex
echo "Compiling with pdflatex (3/4)..."
pdflatex -interaction=nonstopmode main.tex || {
    echo "Warning: Third pdflatex compilation failed (may be normal if only warnings)."
}

# Compilamos con pdflatex
echo "Compiling with pdflatex (4/4)..."
pdflatex -interaction=nonstopmode main.tex || {
    echo "Warning: Fourth pdflatex compilation failed (may be normal if only warnings)."
}

echo "Compilation complete. The 'main.pdf' document should be ready."

