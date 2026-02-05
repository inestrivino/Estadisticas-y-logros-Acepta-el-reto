import { Application } from 'express';
import http from "http";
import { Server } from 'socket.io';

export function initSocket(app:Application) {
    const server = http.createServer(app);
    //prueba de websocket
    const io = new Server(server, {
      cors: { origin: "*" }
    });
    io.on('connection', (socket) => {
      //debug
      console.log(' - Nuevo cliente conectado ' + socket.id.substring(0,2));
    
      //evento para mensajes 1
      socket.on('message', (message) => {
        console.log(message);
        io.emit('message', `${socket.id.substring(0,2)} said ${message}`);
      });
    
      //evento con el que simular los cambios de los datos
      socket.on('messageReload', (message) => {
        const nums:number[] = message.split(' ').map(Number);
        let formatedNums:{name:string, value:number}[] = [];
        let formatedNums2:{name:string, value:number}[] = [];
        for (let i = 0; i < nums.length; i++) {
          if (nums[i] < 0 || isNaN(nums[i])) {
            console.error("Datos inválidos recibidos (números negativos):", message);
            return;
          }
          formatedNums.push({name: `datos${i+1}`, value: nums[i]});
          formatedNums2.push({name: `datos${i+1}`, value: Math.log10(nums[i])});
        }
    
        io.emit('reload-diagrama1', formatedNums);
        io.emit('reload-diagrama2', formatedNums2);
      })
    
      //evento de debug para desconexiones
      socket.on('disconnect', () => {
        console.log(` - Cliente desconectado ${socket.id.substring(0,2)}`);
      });
    });
    server.listen(8080, () => console.log(' * Servidor WebSocket escuchando en el puerto 8080'));
}