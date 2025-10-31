import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "../src/app.js";
import { User } from "../src/models/index.js";
import { logger } from "../src/utils/index.js";

const request = supertest(app);

describe("Authentication Endpoints", () => {
	let mongoServer;

	beforeAll(async () => {
		logger.silent = true;
		mongoServer = await MongoMemoryServer.create();
		const mongoUri = mongoServer.getUri();
		await mongoose.connect(mongoUri);
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
		logger.silent = false;
	});

	beforeEach(async () => {
		await User.deleteMany({});
	});

	describe("POST /api/v1/auth/register", () => {
		const newUser = {
			firstName: "Test",
			lastName: "User",
			email: "test@example.com",
			password: "Password123!",
		};

		it("should register a new user successfully with valid data", async () => {
			const response = await request
				.post("/api/v1/auth/register")
				.send(newUser);

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.email).toBe(newUser.email);
			expect(response.body.data).not.toHaveProperty("password");

			const dbUser = await User.findOne({ email: newUser.email });
			expect(dbUser).not.toBeNull();
			expect(dbUser.password).not.toBe(newUser.password);
		});

		it("should fail to register a user with an existing email", async () => {
			await request.post("/api/v1/auth/register").send(newUser);
			const response = await request
				.post("/api/v1/auth/register")
				.send(newUser);

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toMatch(/already exists/i);
		});

		it("should fail to register a user with an invalid email", async () => {
			const response = await request
				.post("/api/v1/auth/register")
				.send({ ...newUser, email: "email$gmail.com" });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.errors[0].msg).toMatch(
				/provide a valid email address/i
			);
		});

		it("should fail to register a user with an invalid password (too short)", async () => {
			const response = await request.post("/api/v1/auth/register").send({
				...newUser,
				password: "123",
			});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.errors[0].msg).toMatch(
				/at least 8 characters long/i
			);
		});
	});

	describe("POST /api/v1/auth/login", () => {
		const loginUserData = {
			firstName: "Login",
			lastName: "User",
			email: "login@example.com",
			password: "Password123!",
		};

		beforeEach(async () => {
			await request.post("/api/v1/auth/register").send(loginUserData);
		});

		it("should log in a registered user and return tokens", async () => {
			const response = await request.post("/api/v1/auth/login").send({
				email: "login@example.com",
				password: "Password123!",
			});

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toHaveProperty("accessToken");
			expect(response.body.data.user.email).toBe(loginUserData.email);

			const cookies = response.headers["set-cookie"];
			expect(cookies).toBeDefined();
			expect(cookies.some((cookie) => cookie.startsWith("refreshToken="))).toBe(
				true
			);
		});

		it("should fail to log in with an incorrect password", async () => {
			const response = await request.post("/api/v1/auth/login").send({
				email: loginUserData.email,
				password: "WrongPassword!",
			});

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe("Invalid credentials.");
		});

		it("should fail to log in with a non-existent email", async () => {
			const response = await request.post("/api/v1/auth/login").send({
				email: "nouser@example.com",
				password: "Password123!",
			});

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe("Invalid credentials.");
		});
	});

	describe("POST /api/v1/auth/refresh-token", () => {
		const refreshUserData = {
			firstName: "Refresh",
			lastName: "User",
			email: "refresh@example.com",
			password: "Password123!",
		};
		let agent;

		beforeEach(async () => {
			agent = supertest.agent(app);
			await agent.post("/api/v1/auth/register").send(refreshUserData);
			await agent.post("/api/v1/auth/login").send({
				email: refreshUserData.email,
				password: refreshUserData.password,
			});
		});

		it("should issue a new, valid access token if a valid refresh token is provided", async () => {
			const refreshRes = await agent.post("/api/v1/auth/refresh-token").send();

			expect(refreshRes.status).toBe(200);
			expect(refreshRes.body.success).toBe(true);
			const { accessToken } = refreshRes.body.data;
			expect(accessToken).toBeDefined();

			const profileRes = await agent
				.get("/api/v1/users/me")
				.set("Authorization", `Bearer ${accessToken}`);
			expect(profileRes.status).toBe(200);
			expect(profileRes.body.data.email).toBe(refreshUserData.email);
		});

		it("should fail if no refresh token cookie is provided", async () => {
			const response = await request.post("/api/v1/auth/refresh-token").send();

			expect(response.status).toBe(401);
			expect(response.body.message).toMatch(/Authentication invalid/i);
		});
	});

	describe("POST /api/v1/auth/logout", () => {
		const logoutUserData = {
			firstName: "Logout",
			lastName: "User",
			email: "logout@example.com",
			password: "Password123!",
		};
		let agent;

		beforeEach(async () => {
			agent = supertest.agent(app);
			await agent.post("/api/v1/auth/register").send(logoutUserData);
			await agent.post("/api/v1/auth/login").send({
				email: logoutUserData.email,
				password: logoutUserData.password,
			});
		});

		it("should clear the refresh token cookie on logout", async () => {
			const logoutRes = await agent.post("/api/v1/auth/logout").send();

			expect(logoutRes.status).toBe(200);
			expect(logoutRes.body.success).toBe(true);

			const cookies = logoutRes.headers["set-cookie"];
			expect(cookies).toBeDefined();
			const refreshTokenCookie = cookies.find((cookie) =>
				cookie.startsWith("refreshToken=")
			);
			expect(refreshTokenCookie).toBeDefined();
			expect(refreshTokenCookie).toContain("Expires=Thu, 01 Jan 1970");
		});

		it("should remove the refresh token hash from the user document", async () => {
			const userBeforeLogout = await User.findOne({
				email: logoutUserData.email,
			});
			expect(userBeforeLogout.refreshTokens.length).toBeGreaterThan(0);

			await agent.post("/api/v1/auth/logout").send();
			const userAfterLogout = await User.findOne({
				email: logoutUserData.email,
			});
			expect(userAfterLogout.refreshTokens).toHaveLength(0);
		});
	});
});
