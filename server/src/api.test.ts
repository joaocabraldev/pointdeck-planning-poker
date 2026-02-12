import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "./api.js";
import { JWT_SECRET } from "./middleware/auth.js";

describe("API Tests", () => {
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
      expect(response.body).toHaveProperty("created_by");
      expect(response.body.created_by).toEqual({
        id: userId,
        name: userName,
      });
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
      expect(response1.body.created_by).toEqual(response2.body.created_by);
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
      expect(room1.body.created_by.name).toBe("Test User");
      expect(room2.body.created_by.name).toBe("Another User");
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
});
