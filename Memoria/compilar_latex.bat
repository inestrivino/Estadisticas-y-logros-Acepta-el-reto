@echo off
REM ----------------------------------------------------------------
REM Script de compilación LaTeX para Windows (flujo completo)
REM ----------------------------------------------------------------

REM Obtenemos la carpeta donde está el script
SET SCRIPT_DIR=%~dp0

REM Directorio objetivo absoluto
SET TARGET_DIR=%SCRIPT_DIR%Panel_de_estadisticas_y_logros_para_el_juez__Acepta_el_reto_\

echo Directorio actual: %CD%
echo Directorio objetivo: %TARGET_DIR%

REM Cambiamos al directorio objetivo si no estamos ya ahí
IF /I NOT "%CD%"=="%TARGET_DIR%" (
    CD /D "%TARGET_DIR%"
    IF ERRORLEVEL 1 (
        echo Error: No se puede acceder al directorio '%TARGET_DIR%'.
        exit /b 1
    ) ELSE (
        echo Cambié al directorio: %CD%
    )
) ELSE (
    echo Ya estamos en el directorio: %CD%
)

REM Limpiamos archivos auxiliares
echo Cleaning auxiliary files...
del /Q *.aux *.bbl *.blg *.log *.out *.toc *.lof *.lot *.lol *.fls *.fdb_latexmk *.synctex.gz >nul 2>&1

REM Compilamos con pdflatex por primera vez
echo Compiling with pdflatex (1/4)...
pdflatex -interaction=nonstopmode main.tex
IF ERRORLEVEL 1 (
    echo Warning: First pdflatex compilation failed (may be normal if only warnings).
)

REM Ejecutamos bibtex
echo Processing references with bibtex...
bibtex main.aux
IF ERRORLEVEL 1 (
    echo Error: bibtex failed.
    exit /b 1
)

REM Compilamos con pdflatex tres veces más
for /L %%i in (2,1,4) do (
    echo Compiling with pdflatex (%%i/4)...
    pdflatex -interaction=nonstopmode main.tex
    IF ERRORLEVEL 1 (
        echo Warning: pdflatex compilation %%i failed (may be normal if only warnings).
    )
)

echo Compilation complete. The 'main.pdf' document should be ready.
pause