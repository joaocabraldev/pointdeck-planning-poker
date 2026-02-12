import { Router, Response } from "express";
import { ulid } from "ulid";
import { authenticate, AuthRequest } from "./auth.middleware.js";
import { store } from "./store.js";
import { PokerPlanningRoom } from "./pokerPlanningRoom.model.js";

const router = Router();

// Create rooms (protected route - requires authentication)
router.post("/rooms", authenticate, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userName = req.user!.name;

  const roomId = ulid();

  const room: PokerPlanningRoom = {
    id: roomId,
    owner: userId,
    createdAt: new Date(),
    participants: [userId], // Creator is automatically a participant
    votes: {},
    votingStatus: "idle",
    revealed: false,
  };

  store.createRoom(room);

  // Map participant IDs to detailed participant objects
  const participantDetails = room.participants.map(participantId => {
    const user = store.getUser(participantId);
    return {
      id: participantId,
      name: user?.name || "Unknown"
    };
  });

  res.json({ room_id: roomId });
});

// Helper function to get room response
function getRoomResponse(room: PokerPlanningRoom, store: any) {
  const owner = store.getUser(room.owner);
  const participantDetails = room.participants.map((participantId: string) => {
    const user = store.getUser(participantId);
    return {
      id: participantId,
      name: user?.name || "Unknown"
    };
  });

  return {
    room_id: room.id,
    name: room.name,
    created_by: {
      id: room.owner,
      name: owner?.name || "Unknown"
    },
    createdAt: room.createdAt,
    participants: participantDetails,
    votes: room.votes,
    votingStatus: room.votingStatus,
    votingStartedAt: room.votingStartedAt,
    revealed: room.revealed,
  };
}

// Join room
router.post("/rooms/:id/join", authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const room = store.getRoom(id);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  // Add participant if not already in room
  if (!room.participants.includes(userId)) {
    room.participants.push(userId);
    store.updateRoom(id, { participants: room.participants });
  }

  res.status(200).send();
});

// Get room state
router.get("/rooms/:id", authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const room = store.getRoom(id);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  res.json(getRoomResponse(room, store));
});

// Vote
router.post("/rooms/:id/vote", authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { vote } = req.body || {};

  const room = store.getRoom(id);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  // Check if voting is active
  if (room.votingStatus !== "active") {
    return res.status(400).json({ error: "Voting is not active" });
  }

  // Validate vote value
  const validVotes = ["XS", "S", "M", "L"];
  if (!vote || !validVotes.includes(vote)) {
    return res.status(400).json({ error: "Invalid vote. Must be one of: XS, S, M, L" });
  }

  // Check if user is a participant
  if (!room.participants.includes(userId)) {
    return res.status(403).json({ error: "You must join the room first" });
  }

  // Add/update vote
  room.votes[userId] = vote;
  store.updateRoom(id, { votes: room.votes });

  res.status(200).send();
});

// Cancel vote
router.delete("/rooms/:id/vote", authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const room = store.getRoom(id);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  // Check if voting is active
  if (room.votingStatus !== "active") {
    return res.status(400).json({ error: "Voting is not active" });
  }

  // Remove vote
  delete room.votes[userId];
  store.updateRoom(id, { votes: room.votes });

  res.status(200).send();
});

// Start voting
router.post("/rooms/:id/start-voting", authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const room = store.getRoom(id);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  // Only owner can start voting
  if (room.owner !== userId) {
    return res.status(403).json({ error: "Only the room owner can start voting" });
  }

  // Check if voting is already active
  if (room.votingStatus === "active") {
    return res.status(400).json({ error: "Voting is already active" });
  }

  // Start voting - clear previous votes and set status
  store.updateRoom(id, {
    votingStatus: "active",
    votingStartedAt: new Date(),
    votes: {},
    revealed: false,
  });

  res.status(200).send();
});

// Close voting
router.post("/rooms/:id/close-voting", authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const room = store.getRoom(id);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  // Only owner can close voting
  if (room.owner !== userId) {
    return res.status(403).json({ error: "Only the room owner can close voting" });
  }

  // Check if voting is active
  if (room.votingStatus !== "active") {
    return res.status(400).json({ error: "Voting is not active" });
  }

  // Close voting
  store.updateRoom(id, {
    votingStatus: "closed",
    revealed: true,
  });

  res.status(200).send();
});

// Reset voting
router.post("/rooms/:id/reset-voting", authenticate, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;

  const room = store.getRoom(id);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  // Only owner can reset voting
  if (room.owner !== userId) {
    return res.status(403).json({ error: "Only the room owner can reset voting" });
  }

  // Reset voting - clear votes and return to idle state
  // Keep participants and all room configuration
  store.updateRoom(id, {
    votingStatus: "idle",
    votingStartedAt: undefined,
    votes: {},
    revealed: false,
  });

  res.status(200).send();
});

export default router;
