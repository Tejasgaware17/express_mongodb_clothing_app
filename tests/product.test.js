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
	let tShirtCategoryId;
	let jeansCategoryId;

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
		const tShirtCategory = await Category.create({ name: "T-Shirts" });
		tShirtCategoryId = tShirtCategory._id;

		const jeansCategory = await Category.create({ name: "Jeans" });
		jeansCategoryId = jeansCategory._id;
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
		logger.silent = false;
	});

	beforeEach(async () => {
		await Product.deleteMany({});
		await Product.create({
			productType: "top-wear",
			price: 1000,
			title: "Seed T-Shirt",
			description: "A test t-shirt.",
			gender: "men",
			category: tShirtCategoryId,
			style: { fit: "Regular", material: "Cotton", pattern: "Solid" },
			variants: [{ color: "Black", sizes: [{ size: "M", stock: 10 }] }],
		});
		await Product.create({
			productType: "bottom-wear",
			price: 2500,
			title: "Seed Jeans",
			description: "A test pair of jeans.",
			gender: "women",
			category: jeansCategoryId,
			style: { fit: "Slim", material: "Denim", pattern: "Washed" },
			variants: [{ color: "Blue", sizes: [{ size: 32, stock: 15 }] }],
		});
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
				.send({ ...productData, category: tShirtCategoryId });

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.productType).toBe("top-wear");
			expect(response.body.data.title).toBe("REGULAR FIT SOLID T-SHIRTS");
		});

		it("should forbid a non-admin user from creating a product", async () => {
			const response = await request
				.post("/api/v1/products")
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ ...productData, category: tShirtCategoryId });

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

	describe("GET /api/v1/products", () => {
		it("should fetch a list of all products", async () => {
			const response = await request.get("/api/v1/products");
			expect(response.status).toBe(200);
			expect(response.body.data.products).toHaveLength(2);
		});

		it("should filter products by gender", async () => {
			const response = await request.get("/api/v1/products?gender=women");
			expect(response.status).toBe(200);
			expect(response.body.data.products).toHaveLength(1);
			expect(response.body.data.products[0].gender).toBe("women");
		});

		it("should sort products by price (descending)", async () => {
			const response = await request.get("/api/v1/products?sort=-price");
			expect(response.status).toBe(200);
			expect(response.body.data.products[0].price).toBe(2500);
		});
	});

	describe("GET /api/v1/products/:productId", () => {
		it("should fetch a single product by its ID", async () => {
			const allProductsRes = await request.get("/api/v1/products");
			const firstProductId = allProductsRes.body.data.products[0].productId;

			const response = await request.get(`/api/v1/products/${firstProductId}`);

			expect(response.status).toBe(200);
			expect(response.body.data.productId).toBe(firstProductId);
		});

		it("should return 404 for a non-existent product ID", async () => {
			const response = await request.get("/api/v1/products/fake-id");
			expect(response.status).toBe(404);
		});
	});
});
