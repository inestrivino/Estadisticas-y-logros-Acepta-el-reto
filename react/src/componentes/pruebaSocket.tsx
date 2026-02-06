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

    return (
        <>
            <ul id="messages">
            </ul>
            <input placeholder="message" id="input"/>
            <button onClick={handleClick}>Send</button>
        </>
    );
}