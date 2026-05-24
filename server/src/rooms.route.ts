import { Router, Response } from "express";
import { ulid } from "ulid";
import { authenticate, AuthRequest } from "./auth.middleware.js";
import { store } from "./store.js";
import { PokerPlanningRoom, RoomResponse } from "./pokerPlanningRoom.model.js";
import { emitRoomUpdate } from "./socket.js";

const router = Router();

function createRoom(id: string, owner: string, name?: string): PokerPlanningRoom {
  return store.createRoom({
    id,
    name,
    owner,
    createdAt: new Date(),
    participants: [owner],
    votes: {},
    votingStatus: "idle",
    revealed: false,
  });
}

router.post("/rooms", authenticate, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { name } = req.body || {};

  const roomId = ulid();
  createRoom(roomId, userId, name);

  res.json({ room_id: roomId });
});

// Helper function to calculate voting duration in mm:ss format
function calculateVotingDuration(startedAt: Date, closedAt?: Date): string | undefined {
  if (!startedAt) return undefined;
  const endTime = closedAt || new Date();
  const durationMs = endTime.getTime() - startedAt.getTime();
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

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

  const votingDuration = room.votingStartedAt ? calculateVotingDuration(room.votingStartedAt, room.votingClosedAt) : undefined;

  return <RoomResponse>{
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
    votingClosedAt: room.votingClosedAt,
    votingDuration,
    revealed: room.revealed,
    agreedValue: room.agreedValue,
  };
}

// Join room
router.post("/rooms/:id/join", authenticate, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;

  let room = store.getRoom(id);
  if (!room) {
    createRoom(id, userId);
    return res.status(200).send();
  }

  // Add participant if not already in room
  if (!room.participants.includes(userId)) {
    room.participants.push(userId);
    store.updateRoom(id, { participants: room.participants });

    // Emit room update to all subscribers
    emitRoomUpdate(id);
  }

  res.status(200).send();
});

// Remove participant from room
router.delete("/rooms/:id/participants/:participantId", authenticate, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const participantId = req.params.participantId as string;
  const userId = req.user!.id;

  const room = store.getRoom(id);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  // Only owner can remove participants
  if (room.owner !== userId) {
    return res.status(403).json({ error: "Only the room owner can remove participants" });
  }

  // Check if participant exists
  if (!room.participants.includes(participantId)) {
    return res.status(404).json({ error: "Participant not found in room" });
  }

  // Cannot remove the owner
  if (participantId === room.owner) {
    return res.status(400).json({ error: "Cannot remove the room owner" });
  }

  // Remove participant
  room.participants = room.participants.filter(pid => pid !== participantId);

  // Also remove their vote if they had one
  if (room.votes[participantId]) {
    delete room.votes[participantId];
  }

  store.updateRoom(id, { participants: room.participants, votes: room.votes });

  // Emit room update to all subscribers
  emitRoomUpdate(id);

  res.status(200).send();
});

// Transfer room ownership
router.post("/rooms/:id/owner", authenticate, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;
  const { userId: newOwnerId } = req.body || {};

  const room = store.getRoom(id);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  // Only current owner can transfer ownership
  if (room.owner !== userId) {
    return res.status(403).json({ error: "Only the room owner can transfer ownership" });
  }

  // Cannot transfer to yourself
  if (newOwnerId === room.owner) {
    return res.status(400).json({ error: "Cannot transfer ownership to yourself" });
  }

  // New owner must be a participant
  if (!room.participants.includes(newOwnerId)) {
    return res.status(400).json({ error: "Target user is not a participant in this room" });
  }

  // Transfer ownership
  store.updateRoom(id, { owner: newOwnerId });

  // Emit room update to all subscribers
  emitRoomUpdate(id);

  res.status(200).send();
});

// Get room state
router.get("/rooms/:id", authenticate, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;

  const room = store.getRoom(id);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  res.json(getRoomResponse(room, store));
});

// Submit or update a vote
router.post("/rooms/:id/votes", authenticate, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
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

  // Emit room update to all subscribers
  emitRoomUpdate(id);

  res.status(200).send();
});

// Cancel vote
router.delete("/rooms/:id/votes", authenticate, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
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

  // Emit room update to all subscribers
  emitRoomUpdate(id);

  res.status(200).send();
});

// Start voting
router.post("/rooms/:id/voting/start", authenticate, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
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

  // Start voting - clear previous votes, agreed value, and set status
  store.updateRoom(id, {
    votingStatus: "active",
    votingStartedAt: new Date(),
    votingClosedAt: undefined,
    votes: {},
    revealed: false,
    agreedValue: undefined,
  });

  // Emit room update to all subscribers
  emitRoomUpdate(id);

  res.status(200).send();
});

// Close voting
router.post("/rooms/:id/voting/close", authenticate, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
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
    votingClosedAt: new Date(),
    revealed: true,
  });

  // Emit room update to all subscribers
  emitRoomUpdate(id);

  res.status(200).send();
});

// Reset voting
router.post("/rooms/:id/voting/reset", authenticate, (req: AuthRequest, res: Response) => {
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
    votingClosedAt: undefined,
    votes: {},
    revealed: false,
  });

  // Emit room update to all subscribers
  emitRoomUpdate(id);

  res.status(200).send();
});

// Set agreed value (consensus estimate)
router.post("/rooms/:id/agreed-value", authenticate, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;
  const { value } = req.body || {};

  const room = store.getRoom(id);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  // Only owner can set agreed value
  if (room.owner !== userId) {
    return res.status(403).json({ error: "Only the room owner can set the agreed value" });
  }

  // Check if voting is closed
  if (room.votingStatus !== "closed") {
    return res.status(400).json({ error: "Voting must be closed before setting agreed value" });
  }

  // Validate vote value
  const validVotes = ["XS", "S", "M", "L"];
  if (!value || !validVotes.includes(value)) {
    return res.status(400).json({ error: "Invalid value. Must be one of: XS, S, M, L" });
  }

  // Set agreed value
  store.updateRoom(id, { agreedValue: value });

  // Emit room update to all subscribers
  emitRoomUpdate(id);

  res.status(200).send();
});

export default router;
