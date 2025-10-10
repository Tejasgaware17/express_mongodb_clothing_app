import { Router } from "express";
import authRouter from "./auth.route.js";
import userRouter from "./user.route.js";
import categoryRouter from "./category.route.js";
import productRouter from "./product.route.js";
import reviewRouter from "./review.route.js";

const router = Router();
router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/categories", categoryRouter);
router.use("/products", productRouter);
router.use("/reviews", reviewRouter);

export default router;
