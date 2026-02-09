import { socket } from "../socket"; // Socket compartido

export function PruebaSocket() {

    socket.on('message', (text) => {
        const el = document.createElement('li');
        el.innerHTML = text;
        document.getElementById('messages')?.appendChild(el);
    });

    const handleClick = (): void => {
        const input = (document.getElementById('input') as HTMLInputElement)?.value
        socket.emit('messageReload', input);
    }

    async function enviarAceptado() {
        for (let i = 0; i < 5; i++)
            await fetch("/api/nuevo", {method:"POST"})
    }

    return (
        <>
            <ul id="messages">
            </ul>
            <input placeholder="message" id="input"/>
            <button onClick={handleClick}>Send</button>
            
            <br/><br/>
            <button onClick={enviarAceptado}>+1 Aceptado</button>
        </>
    );
}