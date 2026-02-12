import express from "express";
import { createServer } from 'node:http';
import cors from "cors";
import sessionRouter from "./routes/session.js";
import roomsRouter from "./routes/rooms.js";
import { JWT_SECRET } from "./middleware/auth.js";
import { initializeSocket } from "./socket.js";

const app = express();
const server = createServer(app);

// Initialize WebSocket
initializeSocket(server);

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

// Health check endpoint
app.get("/", (_req, res) => {
  res.json({
      health: true
  });
});

// Routes
app.use(sessionRouter);
app.use(roomsRouter);

// Only start the server when not in test mode
if (process.env.NODE_ENV !== 'test') {
  server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
  });
}

// Export for testing
export { app, JWT_SECRET };
