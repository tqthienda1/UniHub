import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';

const SOCKET_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
