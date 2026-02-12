import { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';

let counter = 0;

export function initializeSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on('connection', (socket) => {
    console.log(`a user connected ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`user disconnected ${socket.id}`);
    });

    socket.on('counter', () => {
      counter++;
      console.log('counter event received');
      io.emit('counter', counter);
    });
  });

  // Monitor connected clients (only in non-test mode)
  if (process.env.NODE_ENV !== 'test') {
    setInterval(() => {
      io.fetchSockets().then((sockets) => {
        console.log(`Number of connected clients: ${sockets.length}`);
      }).catch((err) => {
        console.error('Error fetching sockets:', err);
      });
    }, 5000);
  }

  return io;
}
