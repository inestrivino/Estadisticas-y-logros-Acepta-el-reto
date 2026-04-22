require("dotenv").config();
const { notificarEnvio } = require("./notificador"); 

async function main() {
    await notificarEnvio({
        "envioId": 1,
        "usuario": "user1",
        "problema": "problema1",
        "resultado": "AC",
        "lenguaje": "cpp",
        "tiempo": 1,
        "memoria": 1,
        "pos": 1,
        "fecha": "2025-04-03T10"
    });

    console.log("Mensaje enviado correctamente");
    setTimeout(() => process.exit(0), 500);
}

main().catch(err => {
    console.error("Error:", err.message);
    process.exit(1);
});