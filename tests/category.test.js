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
		const mongoUri = mongoServer.getUri();
		await mongoose.connect(mongoUri);

		await request.post("/api/v1/auth/register").send({
			firstName: "Admin",
			lastName: "User",
			email: "admin@test.com",
			password: "Password123!",
		});
		await User.findOneAndUpdate({ email: "admin@test.com" }, { role: "admin" });
		const adminLoginRes = await request
			.post("/api/v1/auth/login")
			.send({ email: "admin@test.com", password: "Password123!" });
		adminToken = adminLoginRes.body.data.accessToken;

		await request.post("/api/v1/auth/register").send({
			firstName: "Customer",
			lastName: "User",
			email: "customer@example.com",
			password: "Password123!",
		});
		const customerLoginRes = await request
			.post("/api/v1/auth/login")
			.send({ email: "customer@example.com", password: "Password123!" });
		customerToken = customerLoginRes.body.data.accessToken;
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
		logger.silent = false;
	});

	beforeEach(async () => {
		await Category.deleteMany({});
	});

	describe("POST /api/v1/categories", () => {
		const categoryData = {
			name: "Test Category",
			description: "Test description for this category",
		};

		it("should allow admin to create a category successfully (and auto-slug generation)", async () => {
			const response = await request
				.post("/api/v1/categories")
				.set("Authorization", `Bearer ${adminToken}`)
				.send(categoryData);

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.name).toBe(categoryData.name);
			expect(response.body.data.slug).toBe("test-category");

			const dbCategory = await Category.findOne({ slug: "test-category" });
			expect(dbCategory).not.toBeNull();
			expect(dbCategory.name).toBe(categoryData.name);
		});

		it("should forbid a non-admin user from creating a category", async () => {
			const response = await request
				.post("/api/v1/categories")
				.set("Authorization", `Bearer ${customerToken}`)
				.send(categoryData);

			expect(response.status).toBe(403);
		});

		it("should fail if required fields (name) are missing", async () => {
			const response = await request
				.post("/api/v1/categories")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ description: "Only description" });

			expect(response.status).toBe(400);
			expect(response.body.errors[0].msg).toMatch(/Category name is required/i);
		});

		it("should fail if the category name already exists", async () => {
			await request
				.post("/api/v1/categories")
				.set("Authorization", `Bearer ${adminToken}`)
				.send(categoryData);

			const response = await request
				.post("/api/v1/categories")
				.set("Authorization", `Bearer ${adminToken}`)
				.send(categoryData);

			expect(response.status).toBe(400);
			expect(response.body.message).toMatch(/already exists/i);
		});
	});

	describe("GET /api/v1/categories", () => {
		it("should allow anyone to fetch all categories", async () => {
			await request
				.post("/api/v1/categories")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ name: "Tops" });
			await request
				.post("/api/v1/categories")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ name: "Pants" });

			const response = await request.get("/api/v1/categories");

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.categories).toHaveLength(2);
			expect(response.body.data.count).toBe(2);
		});

		it("should return an empty array if no categories exist", async () => {
			const response = await request.get("/api/v1/categories");

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.categories).toHaveLength(0);
			expect(response.body.data.count).toBe(0);
		});
	});

	describe("GET /api/v1/categories/:slug", () => {
		it("should fetch a single category by its slug", async () => {
			await request
				.post("/api/v1/categories")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ name: "Skirts" });

			const response = await request.get("/api/v1/categories/skirts");

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.name).toBe("Skirts");
		});

		it("should return 404 if the category slug does not exist", async () => {
			const response = await request.get(
				"/api/v1/categories/non-existent-slug"
			);

			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
		});
	});

	describe("PATCH /api/v1/categories/:slug", () => {
		beforeEach(async () => {
			await request
				.post("/api/v1/categories")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ name: "Jackets" });
		});

		it("should allow an admin to update a category name and description (and auto-update slug)", async () => {
			const updateData = {
				name: "Outer wear",
				description: "Updated description",
			};
			const response = await request
				.patch("/api/v1/categories/jackets")
				.set("Authorization", `Bearer ${adminToken}`)
				.send(updateData);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.name).toBe("Outer wear");
			expect(response.body.data.description).toBe("Updated description");
			expect(response.body.data.slug).toBe("outer-wear");
		});

		it("should fail if the update request body is empty", async () => {
			const response = await request
				.patch("/api/v1/categories/jackets")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toMatch(/No fields provided/i);
		});

		it("should forbid a non-admin user from updating a category", async () => {
			const response = await request
				.patch("/api/v1/categories/jackets")
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ name: "Cannot Update" });

			expect(response.status).toBe(403);
		});
	});

	describe("DELETE /api/v1/categories/:slug", () => {
		beforeEach(async () => {
			await request
				.post("/api/v1/categories")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ name: "ToDelete" });
		});

		it("should allow an admin to delete an empty category", async () => {
			const response = await request
				.delete("/api/v1/categories/todelete")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.message).toMatch(/Category deleted successfully/i);

			const dbCategory = await Category.findOne({ slug: "todelete" });
			expect(dbCategory).toBeNull();
		});

		it("should forbid a non-admin user from deleting a category", async () => {
			const response = await request
				.delete("/api/v1/categories/todelete")
				.set("Authorization", `Bearer ${customerToken}`);

			expect(response.status).toBe(403);
		});

		it("should return 404 if the category slug does not exist", async () => {
			const response = await request
				.delete("/api/v1/categories/non-existent-slug")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(404);
		});
	});
});
