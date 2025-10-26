import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app.js";
import { User } from "../src/models/index.js";
import { logger } from "../src/utils/index.js";

const request = supertest(app);

describe("User Endpoints", () => {
	let mongoServer;
	let adminToken;
	let customerToken;
	let customerUserId;

	beforeAll(async () => {
		logger.silent = true;
		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());

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
		customerUserId = customerLoginRes.body.data.user._id;

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
		logger.silent = false;
	});

	describe("GET /api/v1/users/me", () => {
		it("should allow a logged-in user to fetch their own profile", async () => {
			const response = await request
				.get("/api/v1/users/me")
				.set("Authorization", `Bearer ${customerToken}`);

			expect(response.status).toBe(200);
			expect(response.body.data.email).toBe("customer@test.com");
		});
	});

	describe("GET /api/v1/users (Read All)", () => {
		it("should allow an admin to fetch all users", async () => {
			const response = await request
				.get("/api/v1/users")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(200);
			expect(response.body.data.users).toHaveLength(2);
			expect(response.body.data.count).toBe(2);
		});

		it("should reject read all for non-admin users", async () => {
			const response = await request
				.get("/api/v1/users")
				.set("Authorization", `Bearer ${customerToken}`);

			expect(response.status).toBe(403);
		});
	});

	describe("PATCH /api/v1/users/me", () => {
		it("should allow a user to update their own profile", async () => {
			const updatePayload = { firstName: "UpdatedName" };

			const response = await request
				.patch("/api/v1/users/me")
				.set("Authorization", `Bearer ${customerToken}`)
				.send(updatePayload);

			expect(response.status).toBe(200);
			expect(response.body.data.name.first).toBe("UpdatedName");

			const dbUser = await User.findOne({ email: "customer@test.com" });
			expect(dbUser.name.first).toBe("UpdatedName");
		});

		it("should reject update when no valid data is provided", async () => {
			const response = await request
				.patch("/api/v1/users/me")
				.set("Authorization", `Bearer ${customerToken}`)
				.send({});

			expect(response.status).toBe(400);
			expect(response.body.message).toMatch(/No valid fields/i);
		});

		it("should reject update with invalid data", async () => {
			const response = await request
				.patch("/api/v1/users/me")
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ phone: "123" });

			expect(response.status).toBe(400);
			expect(response.body.errors[0].msg).toMatch(/phone number/i);
		});

		it("should ignore invalid fields and only update allowed fields", async () => {
			const mixedPayload = {
				firstName: "OnlyThisUpdates",
				role: "admin",
				xyz: "shouldBeIgnored",
			};

			const response = await request
				.patch("/api/v1/users/me")
				.set("Authorization", `Bearer ${customerToken}`)
				.send(mixedPayload);

			expect(response.status).toBe(200);
			expect(response.body.data.name.first).toBe("OnlyThisUpdates");
			expect(response.body.data.role).not.toBe("admin");
			expect(response.body.data).not.toHaveProperty("xyz");

			const dbUser = await User.findOne({ email: "customer@test.com" }).select(
				"+role"
			);
			expect(dbUser.name.first).toBe("OnlyThisUpdates");
			expect(dbUser.role).toBe("customer");
			expect(dbUser._doc).not.toHaveProperty("xyz");
		});
	});

	describe("DELETE /api/v1/users/me/addresses/:addressId", () => {
		let firstAddressId;

		beforeEach(async () => {
			await User.updateOne(
				{ _id: customerUserId },
				{ $set: { addresses: [] } }
			);
			const addressRes = await request
				.post("/api/v1/users/me/addresses")
				.set("Authorization", `Bearer ${customerToken}`)
				.send({
					label: "first-address",
					area: "Area1",
					city: "City1",
					state: "State1",
					postalCode: "111111",
				});
			firstAddressId = addressRes.body.data[0].addressId;
		});

		it("should allow a user to delete their own address", async () => {
			await request
				.post("/api/v1/users/me/addresses")
				.set("Authorization", `Bearer ${customerToken}`)
				.send({
					label: "second-address",
					area: "Area2",
					city: "City2",
					state: "State2",
					postalCode: "222222",
				});

			const response = await request
				.delete(`/api/v1/users/me/addresses/${firstAddressId}`)
				.set("Authorization", `Bearer ${customerToken}`);

			expect(response.status).toBe(200);
			expect(response.body.data).toHaveLength(1);
			expect(response.body.data[0].label).toBe("second-address");

			const user = await User.findById(customerUserId);
			expect(user.addresses).toHaveLength(1);
			expect(user.addresses[0].label).toBe("second-address");
		});

		it("should reject deleting the last remaining address", async () => {
			const response = await request
				.delete(`/api/v1/users/me/addresses/${firstAddressId}`)
				.set("Authorization", `Bearer ${customerToken}`);

			expect(response.status).toBe(400);
			expect(response.body.message).toMatch(
				/cannot delete your last remaining address/i
			);
		});

		it("should reject deleting an address that does not exist (404)", async () => {
			await request
				.post("/api/v1/users/me/addresses")
				.set("Authorization", `Bearer ${customerToken}`)
				.send({
					label: "second-address",
					area: "Area2",
					city: "City2",
					state: "State2",
					postalCode: "222222",
				});

			await request
				.delete(`/api/v1/users/me/addresses/${firstAddressId}`)
				.set("Authorization", `Bearer ${customerToken}`);

			const user = await User.findById(customerUserId);
			const response = await request
				.delete(`/api/v1/users/me/addresses/${firstAddressId}`)
				.set("Authorization", `Bearer ${customerToken}`);

			expect(response.status).toBe(404);
		});
	});
});
