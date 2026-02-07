import express from "express";
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from "cors";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

var counter = 0;

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('counter', () => {
        counter++;
        console.log('counter event received');
        io.emit('counter', counter);
    });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});

