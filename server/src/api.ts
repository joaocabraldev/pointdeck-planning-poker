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

app.get("/", (_req, res) => {
  res.json({
      health: true
  });
});

// login
app.post("/session", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  const id = crypto.randomUUID();
  const token = crypto.randomUUID();
  res.json({
    user: { id, name },
    id,
    token,
  });
});

// create rooms
const sessions = new Map<string, { userId: string; roomId: string }>();
app.post("/rooms", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  const id = crypto.randomUUID();
  res.json({
    id,
    name,
  });
});


var counter = 0;

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

setInterval(() => {
    io.fetchSockets().then((sockets) => {
        console.log(`Number of connected clients: ${sockets.length}`);
    }).catch((err) => {
        console.error('Error fetching sockets:', err);
    });
}, 5000);

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});

