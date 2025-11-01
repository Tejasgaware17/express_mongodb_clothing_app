import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app.js";
import {
	User,
	Product,
	Category,
	TopWear,
	BottomWear,
	Review,
} from "../src/models/index.js";
import { logger } from "../src/utils/index.js";

const request = supertest(app);

describe("Product Endpoints", () => {
	let mongoServer;
	let adminToken, customerToken, customerUserId;
	let tShirtCategoryId, jeansCategoryId;
	let sampleProductId, sampleProductObjectId; // Product Id & objectId for reference

	beforeAll(async () => {
		logger.silent = true;
		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());

		await request.post("/api/v1/auth/register").send({
			firstName: "Admin",
			lastName: "Prod",
			email: "adminuser@test.com",
			password: "Password123!",
		});
		await User.updateOne({ email: "adminuser@test.com" }, { role: "admin" });
		const adminLoginRes = await request.post("/api/v1/auth/login").send({
			email: "adminuser@test.com",
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
		customerUserId = customerLoginRes.body.data.user._id;

		// Creating Categories
		const tShirtCategory = await Category.create({ name: "T-Shirt" });
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

		// Sample product 1
		const product1 = await TopWear.create({
			productType: "top-wear",
			price: 1000,
			description: "A test t-shirt.",
			gender: "men",
			category: tShirtCategoryId,
			style: { fit: "Regular", material: "Cotton", pattern: "Solid" },
			variants: [{ color: "black", sizes: [{ size: "M", stock: 10 }] }],
		});

		// Sample product 2
		await TopWear.create({
			productType: "top-wear",
			price: 1050,
			title: "Seed T-Shirt 2",
			description: "Another test t-shirt.",
			gender: "men",
			category: tShirtCategoryId,
			style: { fit: "Slim", material: "Cotton", pattern: "Solid" }, // Different fit
			variants: [{ color: "white", sizes: [{ size: "L", stock: 12 }] }],
		});

		// Sample product 3
		await BottomWear.create({
			productType: "bottom-wear",
			price: 2500,
			description: "A test pair of jeans.",
			gender: "women",
			category: jeansCategoryId,
			style: { fit: "Slim", material: "Denim", pattern: "Washed" },
			variants: [{ color: "blue", sizes: [{ size: 32, stock: 15 }] }],
		});
		sampleProductId = product1.productId;
		sampleProductObjectId = product1._id;
	});

	// CREATE PRODUCT TESTS
	describe("POST /api/v1/products", () => {
		const productData = {
			productType: "top-wear",
			price: 1299,
			description: "New test shirt.",
			gender: "unisex",
			style: { fit: "Loose", material: "Polyester", pattern: "Printed" },
			variants: [{ color: "white", sizes: [{ size: "L", stock: 50 }] }],
		};

		it("should allow an admin to create a product", async () => {
			const response = await request
				.post("/api/v1/products")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ ...productData, category: tShirtCategoryId });

			expect(response.status).toBe(201);
			expect(response.body.data.title).toBe("LOOSE PRINTED T-SHIRT");
			expect(response.body.data.isActive).toBe(true);
			expect(response.body.data.discount).toBe(0);
		});

		it("should prevent a non admin from creating a product", async () => {
			const response = await request
				.post("/api/v1/products")
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ ...productData, category: tShirtCategoryId });

			expect(response.status).toBe(403);
		});

		it("should prevent creating a duplicate product", async () => {
			const existingProductData = {
				productType: "top-wear",
				price: 1000,
				description: "A test t-shirt.",
				gender: "men",
				category: tShirtCategoryId,
				style: { fit: "Regular", material: "Cotton", pattern: "Solid" },
				variants: [{ color: "red", sizes: [{ size: "S", stock: 5 }] }],
			};

			const response = await request
				.post("/api/v1/products")
				.set("Authorization", `Bearer ${adminToken}`)
				.send(existingProductData);

			expect(response.status).toBe(400);
			expect(response.body.message).toMatch(/already exists/i);
		});

		it("should reject creation of a product for invalid productType", async () => {
			const response = await request
				.post("/api/v1/products")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					...productData,
					category: tShirtCategoryId,
					productType: "foot-wear",
				});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe("Validation failed.");
			expect(response.body.errors).toBeDefined();
			expect(response.body.errors).toBeInstanceOf(Array);
			expect(
				response.body.errors.some(
					(err) =>
						err.path === "productType" && err.msg === "Invalid product type."
				)
			).toBe(true);
		});
	});

	// GET PRODUCTS TESTS
	describe("GET /api/v1/products", () => {
		it("should fetch a list of all active products", async () => {
			const response = await request.get("/api/v1/products");

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.products).toHaveLength(3); // expecting 3 products initially
			expect(response.body.meta.totalProducts).toBe(3);
		});

		it("should NOT fetch inactive products", async () => {
			await Product.findByIdAndUpdate(sampleProductObjectId, {
				isActive: false,
			});

			const response = await request.get("/api/v1/products");

			expect(response.status).toBe(200);
			expect(response.body.data.products).toHaveLength(2);
			expect(response.body.meta.totalProducts).toBe(2);
			expect(response.body.data.products[0].productId).not.toBe(
				sampleProductId
			);
		});

		it("should filter products by gender", async () => {
			const response = await request.get("/api/v1/products?gender=women");

			expect(response.status).toBe(200);
			expect(response.body.data.products).toHaveLength(1);
			expect(response.body.data.products[0].gender).toBe("women");
			expect(response.body.meta.totalProducts).toBe(1);
		});

		it("should filter products by category slug", async () => {
			const response = await request.get("/api/v1/products?category=jeans");

			expect(response.status).toBe(200);
			expect(response.body.data.products).toHaveLength(1);
			expect(response.body.data.products[0].category.slug).toBe("jeans");
		});

		it("should filter products by price range", async () => {
			const response = await request.get("/api/v1/products?price[gte]=2000"); // >= 2000

			expect(response.status).toBe(200);
			expect(response.body.data.products).toHaveLength(1);
			expect(response.body.data.products[0].price).toBe(2500); // Only jeans match
		});

		it("should sort products by price (descending)", async () => {
			const response = await request.get("/api/v1/products?sort=-price");

			expect(response.status).toBe(200);
			expect(response.body.data.products[0].price).toBe(2500); // High first
			expect(response.body.data.products[1].price).toBe(1050); // Low second
		});

		it("should paginate products", async () => {
			const response = await request.get("/api/v1/products?limit=1&page=2");

			expect(response.status).toBe(200);
			expect(response.body.data.products).toHaveLength(1);
			expect(response.body.meta.currentPage).toBe(2);
			expect(response.body.meta.totalPages).toBe(3); // Pagination
		});
	});

	describe("GET /api/v1/products/:productId", () => {
		it("should fetch a single active product by its ID", async () => {
			const response = await request.get(`/api/v1/products/${sampleProductId}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.productId).toBe(sampleProductId);
			expect(response.body.data.title).toContain("T-SHIRT");
		});

		it("should return 404 if the product ID does not exist", async () => {
			const response = await request.get("/api/v1/products/non-existent-id");

			expect(response.status).toBe(404);
		});

		it("should return 404 if the product is inactive", async () => {
			await Product.findByIdAndUpdate(sampleProductObjectId, {
				isActive: false,
			});

			const response = await request.get(`/api/v1/products/${sampleProductId}`);

			expect(response.status).toBe(404);
		});
	});

	// UPDATE PRODUCT TESTS
	describe("PATCH /api/v1/products/:productId", () => {
		it("should allow an admin to update core details and style (and auto-update title)", async () => {
			// Arrange: sampleProductId refers to the "Regular Fit Solid T-Shirt" created in beforeEach
			const updatePayload = {
				price: 1150,
				style: { fit: "Oversized" },
			};

			// Act: Updating the product
			const response = await request
				.patch(`/api/v1/products/${sampleProductId}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send(updatePayload);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.price).toBe(1150); // price update
			expect(response.body.data.style.fit).toBe("Oversized"); // style update
			expect(response.body.data.title).toBe("OVERSIZED SOLID T-SHIRT"); // title auto-update
		});

		it("should forbid a non-admin user from updating a product", async () => {
			const response = await request
				.patch(`/api/v1/products/${sampleProductId}`)
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ price: 1200 });

			expect(response.status).toBe(403);
		});

		it("should reject an update that results in a duplicate product", async () => {
			// Arrange: The beforeEach creates a "Regular Fit Solid T-Shirt" and a "Slim Fit Washed Jeans"
			// Act: Trying to update the T-Shirt's style to match the Jeans' style
			const response = await request
				.patch(`/api/v1/products/${sampleProductId}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					style: { fit: "Slim" }, // Changing fit to match the other T-Shirt
				});

			expect(response.status).toBe(400);
			expect(response.body.message).toMatch(/duplicate product/i);
			const product = await Product.findById(sampleProductObjectId);
			expect(product.title).toBe("REGULAR SOLID T-SHIRT");
		});

		it("should reject an update with invalid data", async () => {
			const response = await request
				.patch(`/api/v1/products/${sampleProductId}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ price: "not-a-number" });

			expect(response.status).toBe(400);
			expect(response.body.errors).toBeDefined();
			expect(response.body.errors[0].path).toBe("price");
		});

		it("should reject an update with only invalid style fields", async () => {
			const response = await request
				.patch(`/api/v1/products/${sampleProductId}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ style: { invalidField: "test" } });

			expect(response.status).toBe(400);
			expect(response.body.message).toMatch(/No valid fields provided/i);
		});

		it("should reject an update with an empty request body", async () => {
			const response = await request
				.patch(`/api/v1/products/${sampleProductId}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({});

			expect(response.status).toBe(400);
			expect(response.body.message).toMatch(/No valid fields/i);
		});
	});

	// DELETE PRODUCT TESTS
	describe("DELETE /api/v1/products/:productId", () => {
		it("should allow admin to delete a product", async () => {
			const response = await request
				.delete(`/api/v1/products/${sampleProductId}`)
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.message).toMatch(/Product .* deleted successfully/i);

			const deletedProduct = await Product.findById(sampleProductObjectId);
			expect(deletedProduct).toBeNull();
		});

		it("should delete all associated reviews when a product is deleted", async () => {
			await Review.create({
				rating: 5,
				comment: "This review should be deleted",
				user: customerUserId,
				product: sampleProductObjectId,
			});

			let reviews = await Review.find({ product: sampleProductObjectId });
			expect(reviews).toHaveLength(1);

			await request
				.delete(`/api/v1/products/${sampleProductId}`)
				.set("Authorization", `Bearer ${adminToken}`);

			reviews = await Review.find({ product: sampleProductObjectId });

			const response = await request.get(
				`/api/v1/products/${sampleProductObjectId}/reviews`
			);
			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toMatch(/No product found/i);
			expect(reviews).toHaveLength(0);
		});

		it("should forbid a non-admin user from deleting a product", async () => {
			const response = await request
				.delete(`/api/v1/products/${sampleProductId}`)
				.set("Authorization", `Bearer ${customerToken}`);

			expect(response.status).toBe(403);
		});

		it("should return 404 if the product ID does not exist", async () => {
			const response = await request
				.delete("/api/v1/products/non-existent-id")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(404);
		});
	});

	describe("DELETE /api/v1/categories/:slug (with associated products)", () => {
		it("should prevent deleting a category if it has products associated with it", async () => {
			// Arrange: We know from beforeEach that tShirtCategoryId has products.
			// Act: Trying to delete the 'T-Shirts' category
			const response = await request
				.delete(`/api/v1/categories/t-shirt`)
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toMatch(
				/Cannot delete category because it has associated products/i
			);

			const dbCategory = await Category.findById(tShirtCategoryId);
			expect(dbCategory).not.toBeNull();
		});
	});

	describe("Variant Management Endpoints", () => {
		describe("POST /api/v1/products/:productId/variants", () => {
			const newVariantData = {
				color: "Red",
				sizes: [
					{ size: "M", stock: 20 },
					{ size: "L", stock: 15 },
				],
			};

			it("should allow an admin to add a new variant (color)", async () => {
				const response = await request
					.post(`/api/v1/products/${sampleProductId}/variants`)
					.set("Authorization", `Bearer ${adminToken}`)
					.send(newVariantData);

				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
				expect(response.body.data).toHaveLength(2);
				expect(response.body.data[1].color).toBe("red");

				const product = await Product.findById(sampleProductObjectId);
				expect(product.variants).toHaveLength(2);
				expect(product.variants[1].color).toBe("red");
			});

			it("should forbid a non-admin user from adding a variant", async () => {
				const response = await request
					.post(`/api/v1/products/${sampleProductId}/variants`)
					.set("Authorization", `Bearer ${customerToken}`)
					.send(newVariantData);

				expect(response.status).toBe(403);
			});

			it("should prevent adding a variant with a color that already exists", async () => {
				const response = await request
					.post(`/api/v1/products/${sampleProductId}/variants`)
					.set("Authorization", `Bearer ${adminToken}`)
					.send({ color: "black", sizes: [{ size: "S", stock: 5 }] });

				expect(response.status).toBe(400);
				expect(response.body.message).toMatch(
					/variant with the color 'black' already exists/i
				);
			});

			it("should fail validation if sizes array is empty", async () => {
				const response = await request
					.post(`/api/v1/products/${sampleProductId}/variants`)
					.set("Authorization", `Bearer ${adminToken}`)
					.send({ color: "Green", sizes: [] });

				expect(response.status).toBe(400);
				expect(response.body.errors[0].path).toBe("sizes");
			});

			it("should fail validation if data is missing", async () => {
				const response = await request
					.post(`/api/v1/products/${sampleProductId}/variants`)
					.set("Authorization", `Bearer ${adminToken}`)
					.send({ sizes: [{ size: "S", stock: 5 }] });

				expect(response.status).toBe(400);
				expect(response.body.message).toBe('Validation failed.')
				expect(response.body.errors[0].path).toBe("color");
			});
		});
	});
});
