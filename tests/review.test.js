import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "../src/app.js";
import { User, Category, Product, Review } from "../src/models/index.js";
import { logger } from "../src/utils/index.js";

const request = supertest(app);

describe("Review Endpoints", () => {
	let mongoServer;
	let customerToken;
	let productId;
	let productObjectId;

	beforeAll(async () => {
		logger.silent = true;
		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());

		// User
		await request.post("/api/v1/auth/register").send({
			firstName: "Review",
			lastName: "User",
			email: "review@test.com",
			password: "Password123!",
		});
		const loginRes = await request.post("/api/v1/auth/login").send({
			email: "review@test.com",
			password: "Password123!",
		});
		customerToken = loginRes.body.data.accessToken;

		// Category and Product for test
		const category = await Category.create({ name: "Test Category" });
		const product = await Product.create({
			productType: "top-wear",
			price: 1000,
			title: "Review Product",
			description: "A product to be reviewed.",
			gender: "men",
			category: category._id,
			style: { fit: "Regular", material: "Cotton", pattern: "Solid" },
			variants: [{ color: "White", sizes: [{ size: "L", stock: 5 }] }],
		});
		productId = product.productId;
		productObjectId = product._id;
	});
	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
		logger.silent = false;
	});

	beforeEach(async () => {
		await Review.deleteMany({});
		await Product.findByIdAndUpdate(productObjectId, {
			ratings: { average: 0, count: 0 },
		});
	});

	describe("POST /api/v1/products/:productId/reviews", () => {
		it("should allow a logged-in user to create a review", async () => {
			const reviewData = { rating: 5, comment: "Excellent product!" };

			const response = await request
				.post(`/api/v1/products/${productId}/reviews`)
				.set("Authorization", `Bearer ${customerToken}`)
				.send(reviewData);

			expect(response.status).toBe(201);
			expect(response.body.data.rating).toBe(5);
		});

		it("should update the product average rating after a review is created", async () => {
			await request
				.post(`/api/v1/products/${productId}/reviews`)
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ rating: 4 });

			const product = await Product.findById(productObjectId);
			expect(product.ratings.average).toBe(4);
			expect(product.ratings.count).toBe(1);
		});

		it("should forbid a user from reviewing the same product twice", async () => {
			await request
				.post(`/api/v1/products/${productId}/reviews`)
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ rating: 5 });

			// Second attempt
			const response = await request
				.post(`/api/v1/products/${productId}/reviews`)
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ rating: 3 });

			expect(response.status).toBe(400);
			expect(response.body.message).toContain("already submitted a review");
		});
	});

	describe("GET /api/v1/products/:productId/reviews", () => {
		it("should fetch all reviews for a specific product", async () => {
			await request
				.post(`/api/v1/products/${productId}/reviews`)
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ rating: 5, comment: "Test review" });

			const response = await request.get(
				`/api/v1/products/${productId}/reviews`
			);

			expect(response.status).toBe(200);
			expect(response.body.data.reviews).toHaveLength(1);
			expect(response.body.data.reviews[0].comment).toBe("Test review");
		});
	});
});
