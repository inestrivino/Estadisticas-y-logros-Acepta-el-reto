import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (url: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(url);
    
    newSocket.on('connect', () => {
      console.log(' - Conectado');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log(' - Desconectado');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [url]);

  return { socket, isConnected };
};