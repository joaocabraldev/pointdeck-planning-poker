import { Router } from "express";
import { ulid } from "ulid";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./auth.middleware.js";
import { store } from "./store.js";
import { User } from "./user.model.js";

const router = Router();

// Login - Create session
router.post("/session", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  const id = ulid();

  // Create and store user
  const user: User = {
    id,
    name,
    createdAt: new Date(),
  };

  store.createUser(user);

  // Generate JWT token
  const token = jwt.sign(
    { id, name },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({
    user: { id, name },
    token,
  });
});

export default router;
