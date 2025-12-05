import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "../src/app.js";
import { Category, Product, TopWear, Review } from "../src/models/index.js";
import { calculateAverageRating, logger } from "../src/utils/index.js";

const request = supertest(app);

describe("Review Endpoints", () => {
	let mongoServer;
	let customerToken, otherCustomerToken, customerUserId;
	let productId, productObjectId;

	beforeAll(async () => {
		logger.silent = true;
		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());

		const regRes1 = await request.post("/api/v1/auth/register").send({
			firstName: "Review",
			lastName: "User",
			email: "review@test.com",
			password: "Password123!",
		});
		const loginRes1 = await request.post("/api/v1/auth/login").send({
			email: "review@test.com",
			password: "Password123!",
		});
		customerToken = loginRes1.body.data.accessToken;
		customerUserId = loginRes1.body.data.user._id;

		await request.post("/api/v1/auth/register").send({
			firstName: "Other",
			lastName: "User",
			email: "other@test.com",
			password: "Password123!",
		});
		const loginRes2 = await request.post("/api/v1/auth/login").send({
			email: "other@test.com",
			password: "Password123!",
		});
		otherCustomerToken = loginRes2.body.data.accessToken;

		const category = await Category.create({ name: "Test Category" });
		const product = await TopWear.create({
			productType: "top-wear",
			price: 1000,
			title: "Review Product",
			description: "A product to be reviewed.",
			gender: "unisex",
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

	describe("POST & GET /api/v1/products/:productId/reviews", () => {
		beforeEach(async () => {
			await Review.deleteMany({});
			await Product.findByIdAndUpdate(productObjectId, {
				ratings: { average: 0, count: 0 },
			});
		});

		it("should allow a logged-in user to create a review", async () => {
			const reviewData = { rating: 5, comment: "Excellent product!" };

			const response = await request
				.post(`/api/v1/products/${productId}/reviews`)
				.set("Authorization", `Bearer ${customerToken}`)
				.send(reviewData);

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.comment).toBe(reviewData.comment);
			expect(response.body.data.user).toBe(customerUserId);
		});

		it("should update the product average rating after a review is created", async () => {
			await request
				.post(`/api/v1/products/${productId}/reviews`)
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ rating: 4, comment: "Good product." });

			const updatedProduct = await Product.findById(productObjectId);
			expect(updatedProduct.ratings.average).toBe(4);
			expect(updatedProduct.ratings.count).toBe(1);
		});

		it("should prevent a user from reviewing the same product twice", async () => {
			await request
				.post(`/api/v1/products/${productId}/reviews`)
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ rating: 5, comment: "Nice" });

			const response = await request
				.post(`/api/v1/products/${productId}/reviews`)
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ rating: 3, comment: "Again?" });

			expect(response.status).toBe(400);
			expect(response.body.message).toMatch(/already submitted a review/i);
		});

		it("should fetch all reviews for a product", async () => {
			await request
				.post(`/api/v1/products/${productId}/reviews`)
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ rating: 5, comment: "Great!" });

			const response = await request.get(
				`/api/v1/products/${productId}/reviews`
			);
			expect(response.status).toBe(200);
			expect(response.body.data.reviews).toHaveLength(1);
			expect(response.body.data.reviews[0].comment).toBe("Great!");
		});
	});

	describe("PATCH & DELETE /api/v1/products/:productId/reviews/:reviewId", () => {
		let reviewId;
		beforeEach(async () => {
			await Review.deleteMany({});
			const review = await Review.create({
				rating: 3,
				comment: "Initial comment",
				user: customerUserId,
				product: productObjectId,
			});
			reviewId = review._id;
			await calculateAverageRating(productObjectId);
		});

		it("should allow the author to update their review", async () => {
			const response = await request
				.patch(`/api/v1/products/${productId}/reviews/${reviewId}`)
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ rating: 5, comment: "Updated comment!" });

			expect(response.status).toBe(200);
			expect(response.body.data.comment).toBe("Updated comment!");
			expect(response.body.data.rating).toBe(5);
		});

		it("should recalculate rating after an update", async () => {
			await request
				.patch(`/api/v1/products/${productId}/reviews/${reviewId}`)
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ rating: 1 }); // Updating rating from 3 to 1

			const product = await Product.findById(productObjectId);
			expect(product.ratings.average).toBe(1);
			expect(product.ratings.count).toBe(1);
		});

		it("should forbid another user from updating the review", async () => {
			const response = await request
				.patch(`/api/v1/products/${productId}/reviews/${reviewId}`)
				.set("Authorization", `Bearer ${otherCustomerToken}`) // Different token
				.send({ rating: 1 });

			expect(response.status).toBe(401);
		});

		it("should allow the author to delete their review", async () => {
			const response = await request
				.delete(`/api/v1/products/${productId}/reviews/${reviewId}`)
				.set("Authorization", `Bearer ${customerToken}`);

			expect(response.status).toBe(200);

			const deleted = await Review.findById(reviewId);
			expect(deleted).toBeNull();
		});

		it("should recalculate rating after a delete", async () => {
			await request
				.delete(`/api/v1/products/${productId}/reviews/${reviewId}`)
				.set("Authorization", `Bearer ${customerToken}`);

			const product = await Product.findById(productObjectId);
			expect(product.ratings.average).toBe(0);
			expect(product.ratings.count).toBe(0);
		});

		it("should forbid another user from deleting the review", async () => {
			const response = await request
				.delete(`/api/v1/products/${productId}/reviews/${reviewId}`)
				.set("Authorization", `Bearer ${otherCustomerToken}`); // Different token

			expect(response.status).toBe(401);
		});
	});
});
