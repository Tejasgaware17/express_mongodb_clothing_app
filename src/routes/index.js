import { Router } from "express";
import authRouter from "./auth.route.js";
import userRouter from "./user.route.js";
import categoryRouter from "./category.route.js";

const router = Router();
router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/categories", categoryRouter);

export default router;
