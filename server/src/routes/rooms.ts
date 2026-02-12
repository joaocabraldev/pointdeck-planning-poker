import { Router, Response } from "express";
import { ulid } from "ulid";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Sessions storage (can be moved to a database later)
const sessions = new Map<string, { userId: string; roomId: string }>();

// Create rooms (protected route - requires authentication)
router.post("/rooms", authenticate, (req: AuthRequest, res: Response) => {
  const room_id = ulid();

  // User ID is now available via req.user
  const userId = req.user!.id;
  const userName = req.user!.name;

  res.json({
    room_id,
    created_by: {
      id: userId,
      name: userName
    }
  });
});

export default router;
export { sessions };
