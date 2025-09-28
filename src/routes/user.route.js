import { Router } from "express";
import { getMe, getAllUsers } from "../controllers/index.js";
import {
	authenticateUser,
	authorizePermissions,
} from "../middlewares/index.js";

const router = Router();

router.get("/me", authenticateUser, getMe);

router.get("/", authenticateUser, authorizePermissions("admin"), getAllUsers);

export default router;
