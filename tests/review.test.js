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
	let otherCustomerToken;
	let productId;
	let productObjectId;

	beforeAll(async () => {
		logger.silent = true;
		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());

		// FIRST USER
		await request.post("/api/v1/auth/register").send({
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

		// ANOTHER USER
		await request.post("/api/v1/auth/register").send({
			firstName: "Another",
			lastName: "User",
			email: "another@test.com",
			password: "Password123!",
		});
		const loginRes2 = await request.post("/api/v1/auth/login").send({
			email: "another@test.com",
			password: "Password123!",
		});
		otherCustomerToken = loginRes2.body.data.accessToken;

		// Category and Product for tests
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

	// CREATE + GET REVIEWS
	describe("POST & GET /api/v1/products/:productId/reviews", () => {
		beforeEach(async () => {
			await Review.deleteMany({});
			await Product.findByIdAndUpdate(productObjectId, {
				"ratings.average": 0,
				"ratings.count": 0,
			});
		});

		it("should allow a logged-in user to create a review", async () => {
			const res = await request
				.post(`/api/v1/products/${productId}/reviews`)
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ rating: 5, comment: "Excellent product!" });

			expect(res.status).toBe(201);
			expect(res.body.data.rating).toBe(5);
			expect(res.body.data.comment).toBe("Excellent product!");
		});

		it("should update the product's average rating after review creation", async () => {
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

			const secondRes = await request
				.post(`/api/v1/products/${productId}/reviews`)
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ rating: 3, comment: "Again?" });

			expect(secondRes.status).toBe(400);
			expect(secondRes.body.message).toMatch(/already submitted/i);
		});

		it("should fetch all reviews for a product", async () => {
			await request
				.post(`/api/v1/products/${productId}/reviews`)
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ rating: 5, comment: "Great!" });

			const res = await request.get(`/api/v1/products/${productId}/reviews`);
			expect(res.status).toBe(200);
			expect(res.body.data.reviews).toHaveLength(1);
			expect(res.body.data.reviews[0].comment).toBe("Great!");
		});
	});

	// UPDATE + DELETE REVIEWS
	describe("PATCH & DELETE /api/v1/reviews/:reviewId", () => {
		let reviewId;

		beforeEach(async () => {
			await Review.deleteMany({});
			const user = await User.findOne({ email: "review@test.com" });
			const review = await Review.create({
				rating: 3,
				comment: "Initial comment",
				user: user._id,
				product: productObjectId,
			});
			reviewId = review._id;
		});

		it("should allow the author to update their review", async () => {
			const res = await request
				.patch(`/api/v1/reviews/${reviewId}`)
				.set("Authorization", `Bearer ${customerToken}`)
				.send({ rating: 4, comment: "Updated comment!" });

			expect(res.status).toBe(200);
			expect(res.body.data.comment).toBe("Updated comment!");
			expect(res.body.data.rating).toBe(4);
		});

		it("should forbid another user from updating someone else’s review", async () => {
			const res = await request
				.patch(`/api/v1/reviews/${reviewId}`)
				.set("Authorization", `Bearer ${otherCustomerToken}`)
				.send({ rating: 1 });
			expect(res.status).toBe(401);
			expect(res.body.message).toMatch(/not authorized/i);
		});

		it("should allow the author to delete their review", async () => {
			const res = await request
				.delete(`/api/v1/reviews/${reviewId}`)
				.set("Authorization", `Bearer ${customerToken}`);
			expect(res.status).toBe(200);

			const deleted = await Review.findById(reviewId);
			expect(deleted).toBeNull();
		});

		it("should forbid another user from deleting someone else’s review", async () => {
			const res = await request
				.delete(`/api/v1/reviews/${reviewId}`)
				.set("Authorization", `Bearer ${otherCustomerToken}`);
			expect(res.status).toBe(401);
			expect(res.body.message).toMatch(/not authorized/i);
		});

		it("should recalculate product rating after review deletion", async () => {
			// Second review to ensure change in avg
			const user2 = await User.findOne({ email: "another@test.com" });
			await Review.create({
				rating: 5,
				comment: "Amazing!",
				user: user2._id,
				product: productObjectId,
			});

			// Delete one review
			await request
				.delete(`/api/v1/reviews/${reviewId}`)
				.set("Authorization", `Bearer ${customerToken}`);

			const productAfter = await Product.findById(productObjectId);
			expect(productAfter.ratings.count).toBe(1);
			expect(productAfter.ratings.average).toBe(5);
		});
	});
});
