export default function Cuadrado() {

    const INICIOSEMANA = 2;

    const colores = ["#0c527a", "#2675a6", "#60aade", "#fffdfdc2", "#ffffffc2"]

    function cuadrado(color?: string) {

        if (color === undefined)
            color = colores[Math.floor(Math.random() * 4)]
        const cuadrado = (
            <div
                style={{
                    aspectRatio: "1",
                    borderRadius: "20%",
                    background: color
                }}
            />
        )
        return cuadrado;
    }
    let cuadrados = [];

    //primera semana
    for (let i = 0; i < 7; i++) {
        if (i < INICIOSEMANA) {
            cuadrados.push(
                cuadrado("#fbfbfb00")
            )
        }
        else {
            cuadrados.push(
                cuadrado()
            )
        }
    }

    //resto de semanas
    for (let i = 0; i < 51 * 7 + 1; i++) {
        cuadrados.push(cuadrado())
    }

    //ultima semana
    for (let i = 0; i < 7; i++) {
        if (i >= INICIOSEMANA) {
            cuadrados.push(
                cuadrado("#fbfbfb00")
            )
        }
        else {
            cuadrados.push(
                cuadrado()
            )
        }
    }

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(53, 1fr)`,
            gridTemplateRows: `repeat(7, 1fr)`,
            width: "80%",
            height: "80%",
            gap: "2px",
            gridAutoFlow: "column",
            background: "#adf3ffae",
            padding: "5px", 
            borderRadius: "10px",
        }}>
            {cuadrados}
        </div>
    );
}