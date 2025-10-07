import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "../src/app.js";
import { User } from "../src/models/index.js";

const request = supertest(app);

describe("Authentication Endpoints", () => {
	let mongoServer;

	beforeAll(async () => {
		mongoServer = await MongoMemoryServer.create();
		const mongoUri = mongoServer.getUri();
		await mongoose.connect(mongoUri);
	});
	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
	});

	beforeEach(async () => {
		await User.deleteMany({});
	});

	// TESTS FOR REGISTRATION
	describe("POST /api/v1/auth/register", () => {
		const registrationUserData = {
			firstName: "Testregister",
			lastName: "User",
			email: "registeremail@example.com",
			password: "Password123!",
		};

		// Test for registration
		it("should register a new user successfully with valid data", async () => {
			const response = await request
				.post("/api/v1/auth/register")
				.send(registrationUserData);

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.email).toBe(registrationUserData.email);
			expect(response.body.data.name.first).toBe(
				registrationUserData.firstName
			);

			const dbUser = await User.findOne({ email: registrationUserData.email });
			expect(dbUser).not.toBeNull();
			expect(dbUser.password).not.toBe(registrationUserData.password); // Password to be hashed
		});

		// Test for duplicate user
		it("should fail to register a user with an existing email", async () => {
			await request.post("/api/v1/auth/register").send(registrationUserData);

			// Trying to create new user again with a different name but same details
			const duplicateUser = { ...registrationUserData, firstName: "Jane" };
			const response = await request
				.post("/api/v1/auth/register")
				.send(duplicateUser);

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain("already exists");
		});

		// Test for invalid email
		it("should fail to register a user with an invalid email", async () => {
			const invalidEmailUserData = {
				...registrationUserData,
				email: "invalidemail@_com",
				password: "Password123!",
			};
			const response = await request
				.post("/api/v1/auth/register")
				.send(invalidEmailUserData);

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.errors[0].msg).toContain(
				"provide a valid email address"
			);
		});

		// Test for weak password
		it("should fail to register a user with an invalid password", async () => {
			const weakPasswordUserData = {
				...registrationUserData,
				email: "weak@pass.com",
				password: "123",
			};
			const response = await request
				.post("/api/v1/auth/register")
				.send(weakPasswordUserData);

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.errors[0].msg).toContain(
				"at least 8 characters long"
			);
		});
	});

	// TESTS FOR LOGIN
	describe("POST /api/v1/auth/login", () => {
		const testUserData = {
			firstName: "Login",
			lastName: "Test",
			email: "login@example.com",
			password: "Password123@",
		};

		beforeEach(async () => {
			await request.post("/api/v1/auth/register").send(testUserData);
		});

		// Test for login
		it("should log in a registered user and return tokens", async () => {
			const response = await request.post("/api/v1/auth/login").send({
				email: testUserData.email,
				password: testUserData.password,
			});

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toHaveProperty("accessToken");
			expect(response.body.data.user.email).toBe(testUserData.email);

			// Check for the secure cookie
			const cookies = response.headers["set-cookie"];
			expect(cookies.some((cookie) => cookie.startsWith("refreshToken="))).toBe(
				true
			);
		});

		// Test for incorrect password
		it("should fail to log in with an incorrect password", async () => {
			const response = await request.post("/api/v1/auth/login").send({
				email: testUserData.email,
				password: "Wrong@123",
			});

			expect(response.status).toBe(401);
			expect(response.body.message).toBe("Invalid credentials.");
		});
	});

	// TESTS FOR REFRESH TOKEN
	describe("POST /api/v1/auth/refresh-token", () => {
		const testUserData = {
			firstName: "Refresh",
			lastName: "Test",
			email: "refresh@example.com",
			password: "Password123!",
		};

		it("should issue a new access token if a valid refresh token is provided", async () => {
			const agent = supertest.agent(app);
			await agent.post("/api/v1/auth/register").send(testUserData);
			const loginRes = await agent.post("/api/v1/auth/login").send({
				email: testUserData.email,
				password: testUserData.password,
			});

			const refreshRes = await agent.post("/api/v1/auth/refresh-token").send();

			expect(refreshRes.status).toBe(200);
			const { accessToken } = refreshRes.body.data;
			expect(accessToken).toBeDefined();

			// Using the new token to access a protected route
			const profileRes = await agent
				.get("/api/v1/users/me")
				.set("Authorization", `Bearer ${accessToken}`);

			expect(profileRes.status).toBe(200);
			expect(profileRes.body.data.email).toBe(testUserData.email);
		});
	});

	// TESTS FOR LOGOUT
	describe("POST /api/v1/auth/logout", () => {
		it("should clear the refresh token cookie on logout", async () => {
			const agent = supertest.agent(app);
			const testUserData = {
				firstName: "Logout",
				lastName: "Test",
				email: "logout@example.com",
				password: "Password123@",
			};

			await agent.post("/api/v1/auth/register").send(testUserData);
			await agent.post("/api/v1/auth/login").send({
				email: testUserData.email,
				password: testUserData.password,
			});

			const logoutRes = await agent.post("/api/v1/auth/logout").send();

			expect(logoutRes.status).toBe(200);
			const cookies = logoutRes.headers["set-cookie"];
			const refreshTokenCookie = cookies.find((cookie) =>
				cookie.startsWith("refreshToken=")
			);
			expect(refreshTokenCookie).toContain("Expires=Thu, 01 Jan 1970");
		});
	});
});
