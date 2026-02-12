import { Router } from "express";
import { ulid } from "ulid";
import jwt from "jsonwebtoken";
import { JWT_SECRET, authenticate, AuthRequest } from "./auth.middleware.js";
import { store } from "./store.js";
import { User } from "./user.model.js";

const router = Router();

router.get("/me", authenticate, (req: AuthRequest, res) => {
  const user = store.getUser(req.user!.id);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }
  res.json({ id: user.id, name: user.name });
});

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
