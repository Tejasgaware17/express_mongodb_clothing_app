import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "../src/app.js";
import { User, Category } from "../src/models/index.js";
import { logger } from "../src/utils/index.js";

const request = supertest(app);

describe("Category Endpoints", () => {
	let mongoServer;
	let adminToken;
	let customerToken;

	beforeAll(async () => {
		logger.silent = true;
		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());

		// Creating and logging in as admin and customer
		await request.post("/api/v1/auth/register").send({
			firstName: "Admin",
			lastName: "User",
			email: "admincat@test.com",
			password: "Password123!",
		});
		await User.updateOne({ email: "admincat@test.com" }, { role: "admin" });
		const adminLoginRes = await request.post("/api/v1/auth/login").send({
			email: "admincat@test.com",
			password: "Password123!",
		});
		adminToken = adminLoginRes.body.data.accessToken;

		await request.post("/api/v1/auth/register").send({
			firstName: "Customer",
			lastName: "User",
			email: "customercat@test.com",
			password: "Password123!",
		});
		const customerLoginRes = await request.post("/api/v1/auth/login").send({
			email: "customercat@test.com",
			password: "Password123!",
		});
		customerToken = customerLoginRes.body.data.accessToken;
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
		logger.silent = false;
	});

	// Clear categories before each test
	beforeEach(async () => {
		await Category.deleteMany({});
	});

	// TESTS
	describe("POST /api/v1/categories", () => {
		it("should allow an admin to create a category", async () => {
			const response = await request
				.post("/api/v1/categories")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ name: "Jeans", description: "Denim wear" });

			expect(response.status).toBe(201);
			expect(response.body.data.name).toBe("Jeans");
			expect(response.body.data.slug).toBe("jeans");
		});

		it("should forbid a non-admin user from creating a category", async () => {
			const response = await request
				.post("/api/v1/categories")
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ name: "Shirts" });

			expect(response.status).toBe(403);
		});
	});

	describe("GET /api/v1/categories", () => {
		it("should allow anyone to fetch all categories", async () => {
			await Category.create({ name: "Tops" });
			await Category.create({ name: "Pants" });

			const response = await request.get("/api/v1/categories");

			expect(response.status).toBe(200);
			expect(response.body.data.categories).toHaveLength(2);
		});
	});

	describe("GET /api/v1/categories/:slug", () => {
		it("should fetch a single category by its slug", async () => {
			await Category.create({ name: "Skirts" });

			const response = await request.get("/api/v1/categories/skirts");

			expect(response.status).toBe(200);
			expect(response.body.data.name).toBe("Skirts");
		});
	});

	describe("PATCH /api/v1/categories/:slug", () => {
		it("should allow an admin to update a category", async () => {
			await Category.create({ name: "Jackets" });

			const response = await request
				.patch("/api/v1/categories/jackets")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ description: "Winter wear" });

			expect(response.status).toBe(200);
			expect(response.body.data.description).toBe("Winter wear");
		});
	});

	describe("DELETE /api/v1/categories/:slug", () => {
		it("should allow an admin to delete a category", async () => {
			await Category.create({ name: "Hats" });

			const response = await request
				.delete("/api/v1/categories/hats")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(200);
			expect(response.body.message).toBe("Category deleted successfully.");
		});
	});
});
