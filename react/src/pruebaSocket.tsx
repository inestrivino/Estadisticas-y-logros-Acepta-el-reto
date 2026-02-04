import { io } from "socket.io-client";

export function PruebaSocket() {

    const socket = io('ws://localhost:8080');

    socket.on('message', (text) => {
        const el = document.createElement('li');
        el.innerHTML = text;
        document.querySelector('ul')?.appendChild(el);
    });

    const handleClick = (): void => {
        const input = document.querySelector('input')?.value
        socket.emit('message', input);
    }

    return (
        <>
            <ul>
            </ul>
            <input placeholder="message" />
            <button onClick={handleClick}>Send</button>
        </>
    );
}