import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "./api.js";
import { JWT_SECRET } from "./auth.middleware.js";
import { store } from "./store.js";

describe("API Tests", () => {
  // Clear store before each test to ensure test isolation
  beforeEach(() => {
    store.clear();
  });
  describe("GET /", () => {
    it("should return health check", async () => {
      const response = await request(app).get("/").expect(200);

      expect(response.body).toEqual({
        health: true,
      });
    });
  });

  describe("POST /session", () => {
    it("should create a session with valid name", async () => {
      const response = await request(app)
        .post("/session")
        .send({ name: "John Doe" })
        .expect(200);

      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user).toHaveProperty("name", "John Doe");
      expect(response.body).toHaveProperty("token");

      const decoded = jwt.verify(response.body.token, JWT_SECRET) as {
        id: string;
        name: string;
      };
      expect(decoded.id).toBe(response.body.user.id);
      expect(decoded.name).toBe("John Doe");
    });

    it("should fail when name is missing", async () => {
      const response = await request(app).post("/session").send({}).expect(400);

      expect(response.body).toEqual({
        error: "Name is required",
      });
    });

    it("should fail when name is empty string", async () => {
      const response = await request(app)
        .post("/session")
        .send({ name: "" })
        .expect(400);

      expect(response.body).toEqual({
        error: "Name is required",
      });
    });

    it("should create different sessions for different users", async () => {
      const response1 = await request(app)
        .post("/session")
        .send({ name: "John Doe" })
        .expect(200);

      const response2 = await request(app)
        .post("/session")
        .send({ name: "Jane Smith" })
        .expect(200);

      expect(response1.body.user.id).not.toBe(response2.body.user.id);
      expect(response1.body.token).not.toBe(response2.body.token);
      expect(response1.body.user.name).toBe("John Doe");
      expect(response2.body.user.name).toBe("Jane Smith");
    });
  });

  describe("POST /rooms", () => {
    let authToken: string;
    let userId: string;
    let userName: string;

    beforeEach(async () => {
      // Create a session before each test
      const response = await request(app)
        .post("/session")
        .send({ name: "Test User" });

      authToken = response.body.token;
      userId = response.body.user.id;
      userName = response.body.user.name;
    });

    it("should create a room with valid authentication", async () => {
      const response = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("room_id");
      expect(typeof response.body.room_id).toBe("string");

      // Verify room was created by fetching it
      const roomId = response.body.room_id;
      const roomState = await request(app)
        .get(`/rooms/${roomId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(roomState.body.created_by).toEqual({
        id: userId,
        name: userName,
      });
      expect(roomState.body.participants).toEqual([
        {
          id: userId,
          name: userName,
        },
      ]);
      expect(roomState.body.votes).toEqual({});
      expect(roomState.body.votingStatus).toBe("idle");
      expect(roomState.body.votingStartedAt).toBeUndefined();
      expect(roomState.body.revealed).toBe(false);
    });

    it("should create different rooms for different requests", async () => {
      const response1 = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      const response2 = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response1.body.room_id).not.toBe(response2.body.room_id);
    });

    it("should create rooms for different users", async () => {
      // Create another user
      const session2 = await request(app)
        .post("/session")
        .send({ name: "Another User" });

      const authToken2 = session2.body.token;

      const room1 = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      const room2 = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${authToken2}`)
        .expect(200);

      expect(room1.body.room_id).not.toBe(room2.body.room_id);

      // Fetch rooms to verify owners
      const room1State = await request(app)
        .get(`/rooms/${room1.body.room_id}`)
        .set("Authorization", `Bearer ${authToken}`);

      const room2State = await request(app)
        .get(`/rooms/${room2.body.room_id}`)
        .set("Authorization", `Bearer ${authToken2}`);

      expect(room1State.body.created_by.name).toBe("Test User");
      expect(room2State.body.created_by.name).toBe("Another User");
    });

    it("should fail without authentication", async () => {
      const response = await request(app).post("/rooms").expect(401);

      expect(response.body).toEqual({
        error: "No token provided",
      });
    });

    it("should fail with invalid token", async () => {
      const response = await request(app)
        .post("/rooms")
        .set("Authorization", "Bearer invalid-token-here")
        .expect(401);

      expect(response.body).toEqual({
        error: "Invalid or expired token",
      });
    });

    it("should fail with malformed authorization header (missing Bearer prefix)", async () => {
      const response = await request(app)
        .post("/rooms")
        .set("Authorization", authToken)
        .expect(401);

      expect(response.body).toEqual({
        error: "No token provided",
      });
    });

    it("should fail with expired token", async () => {
      // Create an expired token (expired 1 hour ago)
      const expiredToken = jwt.sign(
        { id: "test-id", name: "Test User" },
        JWT_SECRET,
        { expiresIn: "-1h" }
      );

      const response = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toEqual({
        error: "Invalid or expired token",
      });
    });
  });

  describe("Room Management and Voting", () => {
    let ownerToken: string;
    let ownerId: string;
    let ownerName: string;
    let participantToken: string;
    let participantId: string;
    let participantName: string;
    let roomId: string;

    beforeEach(async () => {
      // Create owner
      const ownerSession = await request(app)
        .post("/session")
        .send({ name: "Room Owner" });
      ownerToken = ownerSession.body.token;
      ownerId = ownerSession.body.user.id;
      ownerName = ownerSession.body.user.name;

      // Create participant
      const participantSession = await request(app)
        .post("/session")
        .send({ name: "Participant" });
      participantToken = participantSession.body.token;
      participantId = participantSession.body.user.id;
      participantName = participantSession.body.user.name;

      // Create room
      const roomResponse = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${ownerToken}`);
      roomId = roomResponse.body.room_id;
    });

    describe("POST /rooms/:id/join", () => {
      it("should allow user to join a room", async () => {
        await request(app)
          .post(`/rooms/${roomId}/join`)
          .set("Authorization", `Bearer ${participantToken}`)
          .expect(200);

        // Verify participant was added
        const room = await request(app)
          .get(`/rooms/${roomId}`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .expect(200);

        expect(room.body.participants).toHaveLength(2);
        expect(room.body.participants).toContainEqual({
          id: participantId,
          name: participantName,
        });
      });

      it("should recreate a missing room with the requested ID", async () => {
        const fixedRoomId = "fixed-team-room";

        await request(app)
          .post(`/rooms/${fixedRoomId}/join`)
          .set("Authorization", `Bearer ${participantToken}`)
          .expect(200);

        const room = await request(app)
          .get(`/rooms/${fixedRoomId}`)
          .set("Authorization", `Bearer ${participantToken}`)
          .expect(200);

        expect(room.body.room_id).toBe(fixedRoomId);
        expect(room.body.created_by).toEqual({
          id: participantId,
          name: participantName,
        });
        expect(room.body.participants).toEqual([
          {
            id: participantId,
            name: participantName,
          },
        ]);
        expect(room.body.votes).toEqual({});
        expect(room.body.votingStatus).toBe("idle");
        expect(room.body.revealed).toBe(false);
      });
    });

    describe("GET /rooms/:id", () => {
      it("should return room state", async () => {
        const response = await request(app)
          .get(`/rooms/${roomId}`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .expect(200);

        expect(response.body).toHaveProperty("room_id", roomId);
        expect(response.body).toHaveProperty("created_by");
        expect(response.body).toHaveProperty("participants");
        expect(response.body).toHaveProperty("votes");
        expect(response.body).toHaveProperty("votingStatus");
        expect(response.body).toHaveProperty("revealed");
        expect(response.body.votingStatus).toBe("idle");
      });

      it("should return 404 for non-existent room", async () => {
        await request(app)
          .get("/rooms/non-existent-id")
          .set("Authorization", `Bearer ${ownerToken}`)
          .expect(404);
      });
    });

    describe("POST /rooms/:id/owner", () => {
      it("should allow owner to transfer ownership to a participant", async () => {
        // Join as participant
        await request(app)
          .post(`/rooms/${roomId}/join`)
          .set("Authorization", `Bearer ${participantToken}`);

        // Transfer ownership
        await request(app)
          .post(`/rooms/${roomId}/owner`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .send({ userId: participantId })
          .expect(200);

        // Verify new owner
        const room = await request(app)
          .get(`/rooms/${roomId}`)
          .set("Authorization", `Bearer ${ownerToken}`);

        expect(room.body.created_by.id).toBe(participantId);
      });

      it("should not allow non-owner to transfer ownership", async () => {
        // Join as participant
        await request(app)
          .post(`/rooms/${roomId}/join`)
          .set("Authorization", `Bearer ${participantToken}`);

        const response = await request(app)
          .post(`/rooms/${roomId}/owner`)
          .set("Authorization", `Bearer ${participantToken}`)
          .send({ userId: participantId })
          .expect(403);

        expect(response.body.error).toBe("Only the room owner can transfer ownership");
      });

      it("should not allow transferring to non-participant", async () => {
        // participantId has NOT joined the room
        const response = await request(app)
          .post(`/rooms/${roomId}/owner`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .send({ userId: participantId })
          .expect(400);

        expect(response.body.error).toBe("Target user is not a participant in this room");
      });

      it("should not allow transferring to yourself", async () => {
        const response = await request(app)
          .post(`/rooms/${roomId}/owner`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .send({ userId: ownerId })
          .expect(400);

        expect(response.body.error).toBe("Cannot transfer ownership to yourself");
      });

      it("should return 404 for non-existent room", async () => {
        await request(app)
          .post("/rooms/non-existent-id/owner")
          .set("Authorization", `Bearer ${ownerToken}`)
          .send({ userId: participantId })
          .expect(404);
      });

      it("should allow new owner to perform owner actions after transfer", async () => {
        // Join as participant
        await request(app)
          .post(`/rooms/${roomId}/join`)
          .set("Authorization", `Bearer ${participantToken}`);

        // Transfer ownership
        await request(app)
          .post(`/rooms/${roomId}/owner`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .send({ userId: participantId })
          .expect(200);

        // New owner should be able to start voting
        await request(app)
          .post(`/rooms/${roomId}/voting/start`)
          .set("Authorization", `Bearer ${participantToken}`)
          .expect(200);

        // Verify voting started
        const room = await request(app)
          .get(`/rooms/${roomId}`)
          .set("Authorization", `Bearer ${ownerToken}`);

        expect(room.body.votingStatus).toBe("active");
      });
    });

    describe("POST /rooms/:id/start-voting", () => {
      it("should allow owner to start voting", async () => {
        await request(app)
          .post(`/rooms/${roomId}/start-voting`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .expect(200);

        // Verify voting started
        const room = await request(app)
          .get(`/rooms/${roomId}`)
          .set("Authorization", `Bearer ${ownerToken}`);

        expect(room.body.votingStatus).toBe("active");
        expect(room.body.votingStartedAt).toBeDefined();
        expect(room.body.votes).toEqual({});
        expect(room.body.revealed).toBe(false);
      });

      it("should not allow non-owner to start voting", async () => {
        // Join as participant
        await request(app)
          .post(`/rooms/${roomId}/join`)
          .set("Authorization", `Bearer ${participantToken}`);

        const response = await request(app)
          .post(`/rooms/${roomId}/start-voting`)
          .set("Authorization", `Bearer ${participantToken}`)
          .expect(403);

        expect(response.body.error).toBe("Only the room owner can start voting");
      });

      it("should not allow starting voting when already active", async () => {
        // Start voting first time
        await request(app)
          .post(`/rooms/${roomId}/start-voting`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .expect(200);

        // Try to start again
        const response = await request(app)
          .post(`/rooms/${roomId}/start-voting`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .expect(400);

        expect(response.body.error).toBe("Voting is already active");
      });
    });

    describe("POST /rooms/:id/vote", () => {
      beforeEach(async () => {
        // Join room as participant
        await request(app)
          .post(`/rooms/${roomId}/join`)
          .set("Authorization", `Bearer ${participantToken}`);

        // Start voting
        await request(app)
          .post(`/rooms/${roomId}/start-voting`)
          .set("Authorization", `Bearer ${ownerToken}`);
      });

      it("should allow participant to vote with valid value", async () => {
        await request(app)
          .post(`/rooms/${roomId}/vote`)
          .set("Authorization", `Bearer ${participantToken}`)
          .send({ vote: "M" })
          .expect(200);

        // Verify vote was recorded
        const room = await request(app)
          .get(`/rooms/${roomId}`)
          .set("Authorization", `Bearer ${ownerToken}`);

        expect(room.body.votes[participantId]).toBe("M");
      });

      it("should allow all valid vote values (XS, S, M, L)", async () => {
        const validVotes = ["XS", "S", "M", "L"];

        for (const vote of validVotes) {
          await request(app)
            .post(`/rooms/${roomId}/vote`)
            .set("Authorization", `Bearer ${participantToken}`)
            .send({ vote })
            .expect(200);
        }
      });

      it("should reject invalid vote values", async () => {
        const response = await request(app)
          .post(`/rooms/${roomId}/vote`)
          .set("Authorization", `Bearer ${participantToken}`)
          .send({ vote: "XL" })
          .expect(400);

        expect(response.body.error).toBe("Invalid vote. Must be one of: XS, S, M, L");
      });

      it("should not allow voting when voting is not active", async () => {
        // Close voting
        await request(app)
          .post(`/rooms/${roomId}/close-voting`)
          .set("Authorization", `Bearer ${ownerToken}`);

        const response = await request(app)
          .post(`/rooms/${roomId}/vote`)
          .set("Authorization", `Bearer ${participantToken}`)
          .send({ vote: "M" })
          .expect(400);

        expect(response.body.error).toBe("Voting is not active");
      });

      it("should not allow non-participants to vote", async () => {
        // Create another user who hasn't joined
        const outsiderSession = await request(app)
          .post("/session")
          .send({ name: "Outsider" });

        const response = await request(app)
          .post(`/rooms/${roomId}/vote`)
          .set("Authorization", `Bearer ${outsiderSession.body.token}`)
          .send({ vote: "M" })
          .expect(403);

        expect(response.body.error).toBe("You must join the room first");
      });
    });

    describe("DELETE /rooms/:id/vote", () => {
      beforeEach(async () => {
        // Join room as participant
        await request(app)
          .post(`/rooms/${roomId}/join`)
          .set("Authorization", `Bearer ${participantToken}`);

        // Start voting
        await request(app)
          .post(`/rooms/${roomId}/start-voting`)
          .set("Authorization", `Bearer ${ownerToken}`);

        // Cast a vote
        await request(app)
          .post(`/rooms/${roomId}/vote`)
          .set("Authorization", `Bearer ${participantToken}`)
          .send({ vote: "M" });
      });

      it("should allow participant to cancel their vote", async () => {
        await request(app)
          .delete(`/rooms/${roomId}/vote`)
          .set("Authorization", `Bearer ${participantToken}`)
          .expect(200);

        // Verify vote was removed
        const room = await request(app)
          .get(`/rooms/${roomId}`)
          .set("Authorization", `Bearer ${ownerToken}`);

        expect(room.body.votes[participantId]).toBeUndefined();
      });

      it("should not allow canceling vote when voting is not active", async () => {
        // Close voting
        await request(app)
          .post(`/rooms/${roomId}/close-voting`)
          .set("Authorization", `Bearer ${ownerToken}`);

        const response = await request(app)
          .delete(`/rooms/${roomId}/vote`)
          .set("Authorization", `Bearer ${participantToken}`)
          .expect(400);

        expect(response.body.error).toBe("Voting is not active");
      });
    });

    describe("POST /rooms/:id/close-voting", () => {
      beforeEach(async () => {
        // Join room as participant
        await request(app)
          .post(`/rooms/${roomId}/join`)
          .set("Authorization", `Bearer ${participantToken}`);

        // Start voting
        await request(app)
          .post(`/rooms/${roomId}/start-voting`)
          .set("Authorization", `Bearer ${ownerToken}`);

        // Cast votes
        await request(app)
          .post(`/rooms/${roomId}/vote`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .send({ vote: "S" });

        await request(app)
          .post(`/rooms/${roomId}/vote`)
          .set("Authorization", `Bearer ${participantToken}`)
          .send({ vote: "M" });
      });

      it("should allow owner to close voting and reveal votes", async () => {
        await request(app)
          .post(`/rooms/${roomId}/close-voting`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .expect(200);

        // Verify voting closed
        const room = await request(app)
          .get(`/rooms/${roomId}`)
          .set("Authorization", `Bearer ${ownerToken}`);

        expect(room.body.votingStatus).toBe("closed");
        expect(room.body.revealed).toBe(true);
        expect(room.body.votes[ownerId]).toBe("S");
        expect(room.body.votes[participantId]).toBe("M");
      });

      it("should not allow non-owner to close voting", async () => {
        const response = await request(app)
          .post(`/rooms/${roomId}/close-voting`)
          .set("Authorization", `Bearer ${participantToken}`)
          .expect(403);

        expect(response.body.error).toBe("Only the room owner can close voting");
      });

      it("should not allow closing voting when not active", async () => {
        // Close voting first time
        await request(app)
          .post(`/rooms/${roomId}/close-voting`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .expect(200);

        // Try to close again
        const response = await request(app)
          .post(`/rooms/${roomId}/close-voting`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .expect(400);

        expect(response.body.error).toBe("Voting is not active");
      });
    });

    describe("POST /rooms/:id/reset-voting", () => {
      beforeEach(async () => {
        // Join room as participant
        await request(app)
          .post(`/rooms/${roomId}/join`)
          .set("Authorization", `Bearer ${participantToken}`);

        // Start voting
        await request(app)
          .post(`/rooms/${roomId}/start-voting`)
          .set("Authorization", `Bearer ${ownerToken}`);

        // Cast votes
        await request(app)
          .post(`/rooms/${roomId}/vote`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .send({ vote: "S" });

        await request(app)
          .post(`/rooms/${roomId}/vote`)
          .set("Authorization", `Bearer ${participantToken}`)
          .send({ vote: "M" });

        // Close voting
        await request(app)
          .post(`/rooms/${roomId}/close-voting`)
          .set("Authorization", `Bearer ${ownerToken}`);
      });

      it("should allow owner to reset voting session", async () => {
        await request(app)
          .post(`/rooms/${roomId}/reset-voting`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .expect(200);

        // Verify voting was reset
        const room = await request(app)
          .get(`/rooms/${roomId}`)
          .set("Authorization", `Bearer ${ownerToken}`);

        expect(room.body.votingStatus).toBe("idle");
        expect(room.body.votes).toEqual({});
        expect(room.body.revealed).toBe(false);
        expect(room.body.votingStartedAt).toBeUndefined();

        // Verify participants are still there
        expect(room.body.participants).toHaveLength(2);
        expect(room.body.participants).toContainEqual({
          id: ownerId,
          name: ownerName,
        });
        expect(room.body.participants).toContainEqual({
          id: participantId,
          name: participantName,
        });
      });

      it("should not allow non-owner to reset voting", async () => {
        const response = await request(app)
          .post(`/rooms/${roomId}/reset-voting`)
          .set("Authorization", `Bearer ${participantToken}`)
          .expect(403);

        expect(response.body.error).toBe("Only the room owner can reset voting");
      });

      it("should allow resetting from idle state", async () => {
        // First reset
        await request(app)
          .post(`/rooms/${roomId}/reset-voting`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .expect(200);

        // Reset again from idle state
        await request(app)
          .post(`/rooms/${roomId}/reset-voting`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .expect(200);

        // Verify still in idle state
        const room = await request(app)
          .get(`/rooms/${roomId}`)
          .set("Authorization", `Bearer ${ownerToken}`);

        expect(room.body.votingStatus).toBe("idle");
        expect(room.body.votes).toEqual({});
      });

      it("should allow starting new voting session after reset", async () => {
        // Reset voting
        await request(app)
          .post(`/rooms/${roomId}/reset-voting`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .expect(200);

        // Start new voting session
        await request(app)
          .post(`/rooms/${roomId}/start-voting`)
          .set("Authorization", `Bearer ${ownerToken}`)
          .expect(200);

        // Verify new session started
        const room = await request(app)
          .get(`/rooms/${roomId}`)
          .set("Authorization", `Bearer ${ownerToken}`);

        expect(room.body.votingStatus).toBe("active");
        expect(room.body.votes).toEqual({});
        expect(room.body.votingStartedAt).toBeDefined();
      });

      it("should return 404 for non-existent room", async () => {
        await request(app)
          .post("/rooms/non-existent-id/reset-voting")
          .set("Authorization", `Bearer ${ownerToken}`)
          .expect(404);
      });
    });
  });
});
