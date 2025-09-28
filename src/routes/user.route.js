import { Router } from "express";
import { getMe } from "../controllers/index.js";
import { authenticateUser } from "../middlewares/index.js";

const router = Router();

router.get("/me", authenticateUser, getMe);

export default router;
