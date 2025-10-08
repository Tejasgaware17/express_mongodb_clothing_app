import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "../src/app.js";
import { User } from "../src/models/index.js";

const request = supertest(app);

describe("User Endpoints", () => {
	let mongoServer;
	let customerToken;
	let adminToken;

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

		// Regular customer
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

		// Admin user
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

	describe("GET /api/v1/users/me", () => {
		it("should allow a logged-in user to fetch their own profile", async () => {
			const response = await request
				.get("/api/v1/users/me")
				.set("Authorization", `Bearer ${customerToken}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.email).toBe("customer@test.com");
		});

		it("should return a 401 error if no token is provided", async () => {
			const response = await request.get("/api/v1/users/me");

			expect(response.status).toBe(401);
		});
	});
});
