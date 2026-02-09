import { Application } from 'express';
import http from "http";
import { Server } from 'socket.io';

let io: Server;

export function initSocket(app: Application) {
  const server = http.createServer(app);
  //prueba de websocket
  io = new Server(server, {
    cors: { origin: "*" }
  });
  server.listen(8080, () => console.log(' * Servidor WebSocket escuchando en el puerto 8080'));
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io no ha sido inicializado");
  }
  return io;
};