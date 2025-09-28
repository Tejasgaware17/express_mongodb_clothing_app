import { Router } from "express";
import authRouter from "./auth.route.js";
import userRouter from "./user.route.js"

const router = Router();
router.use("/auth", authRouter);
router.use("/users", userRouter);

export default router;
