import "dotenv/config";
import express from "express";
import { createServer } from 'node:http';
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import sessionRouter from "./session.route.js";
import roomsRouter from "./rooms.route.js";
import { JWT_SECRET } from "./auth.middleware.js";
import { initializeSocket } from "./socket.js";
import { swaggerSpec } from "./swagger.config.js";

const app = express();
const server = createServer(app);

// Initialize WebSocket
initializeSocket(server);

app.use(express.json());
app.use(cors({ origin: "*" }));

// Health check endpoint
app.get("/", (_req, res) => {
  res.json({
      health: true
  });
});

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    url: "/api-docs.json"
  }
}));

// API spec endpoint
app.get("/api-docs.json", (_req, res) => {
  res.json(swaggerSpec);
});

// Routes
app.use(sessionRouter);
app.use(roomsRouter);

// Only start the server when not in test mode
if (process.env.NODE_ENV !== 'test') {
  const port: Number = Number(process.env.PORT || 3000);

  if (Number.isInteger(port)) {
    server.listen(port, () => {
      console.log(`server running at http://localhost:${port}`);
    });
  
  } else {
    throw new Error("Invalid port number");
  }
}

// Export for testing
export { app, JWT_SECRET };
