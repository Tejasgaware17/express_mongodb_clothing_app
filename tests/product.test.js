import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "../src/app.js";
import { User, Category, Product } from "../src/models/index.js";
import { logger } from "../src/utils/index.js";

const request = supertest(app);

describe("Product Endpoints", () => {
	let mongoServer;
	let adminToken;
	let customerToken;
	let categoryId;

	beforeAll(async () => {
		logger.silent = true;
		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());

		// Creating and logging in as admin and customer
		await request.post("/api/v1/auth/register").send({
			firstName: "Admin",
			lastName: "Prod",
			email: "adminprod@test.com",
			password: "Password123!",
		});
		await User.updateOne({ email: "adminprod@test.com" }, { role: "admin" });
		const adminLoginRes = await request.post("/api/v1/auth/login").send({
			email: "adminprod@test.com",
			password: "Password123!",
		});
		adminToken = adminLoginRes.body.data.accessToken;

		await request.post("/api/v1/auth/register").send({
			firstName: "Customer",
			lastName: "Prod",
			email: "customerprod@test.com",
			password: "Password123!",
		});
		const customerLoginRes = await request.post("/api/v1/auth/login").send({
			email: "customerprod@test.com",
			password: "Password123!",
		});
		customerToken = customerLoginRes.body.data.accessToken;

		// Creating a category to use for products
		const category = await Category.create({ name: "T-Shirts" });
		categoryId = category._id;
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
		logger.silent = false;
	});

	// Clearing products before each test
	beforeEach(async () => {
		await Product.deleteMany({});
	});

	// TESTS
	describe("POST /api/v1/products", () => {
		const productData = {
			productType: "top-wear",
			price: 1299,
			description: "A test t-shirt.",
			gender: "men",
			style: {
				fit: "Regular Fit",
				material: "Cotton",
				pattern: "Solid",
			},
			variants: [
				{
					color: "Black",
					sizes: [{ size: "M", stock: 50 }],
				},
			],
		};

		it("should allow an admin to create a product", async () => {
			const response = await request
				.post("/api/v1/products")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ ...productData, category: categoryId });

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.productType).toBe("top-wear");
			expect(response.body.data.title).toBe("REGULAR FIT SOLID T-SHIRTS");
		});

		it("should forbid a non-admin user from creating a product", async () => {
			const response = await request
				.post("/api/v1/products")
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ ...productData, category: categoryId });

			expect(response.status).toBe(403);
		});

		it("should fail if required fields are missing", async () => {
			const response = await request
				.post("/api/v1/products")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ productType: "top-wear", price: 999 }); // Missing required fields

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});
	});
});
