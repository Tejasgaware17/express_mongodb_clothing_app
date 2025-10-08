import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "../src/app.js";
import { User } from "../src/models/index.js";
import { logger } from "../src/utils/index.js";

const request = supertest(app);

describe("User Endpoints", () => {
	let mongoServer;
	let customerToken;
	let adminToken;

	beforeAll(async () => {
		// Disabling logging for tests
		logger.silent = true;

		mongoServer = await MongoMemoryServer.create();
		const mongoUri = mongoServer.getUri();
		await mongoose.connect(mongoUri);

		// SETING-UP USERS ONCE
		await User.deleteMany({});

		// Creating and Logging in as a regular customer
		await request.post("/api/v1/auth/register").send({
			firstName: "Customer",
			lastName: "User",
			email: "customer@test.com",
			password: "Password123!",
		});
		const customerLoginRes = await request.post("/api/v1/auth/login").send({
			email: "customer@test.com",
			password: "Password123!",
		});
		customerToken = customerLoginRes.body.data.accessToken;

		// Creating and Logging in as an admin user
		await request.post("/api/v1/auth/register").send({
			firstName: "Admin",
			lastName: "User",
			email: "admin@test.com",
			password: "Password123!",
		});
		await User.updateOne({ email: "admin@test.com" }, { role: "admin" });
		const adminLoginRes = await request.post("/api/v1/auth/login").send({
			email: "admin@test.com",
			password: "Password123!",
		});
		adminToken = adminLoginRes.body.data.accessToken;
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
		logger.silent = false; // Re-enabling logging after tests
	});

	describe("GET /api/v1/users/me", () => {
		it("should allow a logged-in user to fetch their own profile", async () => {
			const response = await request
				.get("/api/v1/users/me")
				.set("Authorization", `Bearer ${customerToken}`);
			expect(response.status).toBe(200);
			expect(response.body.data.email).toBe("customer@test.com");
		});

		it("should return a 401 error if no token is provided", async () => {
			const response = await request.get("/api/v1/users/me");
			expect(response.status).toBe(401);
		});
	});

	describe("PATCH /api/v1/users/me", () => {
		it("should allow a user to update their own profile", async () => {
			const response = await request
				.patch("/api/v1/users/me")
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ firstName: "Updated" });
			expect(response.status).toBe(200);
			expect(response.body.data.name.first).toBe("Updated");
		});

		it("should return a 400 error for invalid update data", async () => {
			const response = await request
				.patch("/api/v1/users/me")
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ phone: "12345" });
			expect(response.status).toBe(400);
		});
	});

	describe("GET /api/v1/users", () => {
		it("should allow an admin user to fetch all users", async () => {
			const response = await request
				.get("/api/v1/users")
				.set("Authorization", `Bearer ${adminToken}`);
			expect(response.status).toBe(200);
			expect(response.body.data.users).toHaveLength(2);
		});

		it("should return a 403 Forbidden error for a non-admin user", async () => {
			const response = await request
				.get("/api/v1/users")
				.set("Authorization", `Bearer ${customerToken}`);
			expect(response.status).toBe(403);
		});
	});
});
