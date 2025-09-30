import { Router } from "express";
import { getMe, getAllUsers, updateUser } from "../controllers/index.js";
import {
	authenticateUser,
	authorizePermissions,
	handleValidationErrors,
} from "../middlewares/index.js";
import { updateUserValidator } from "../validators/index.js";

const router = Router();

router
	.route("/me")
	.all(authenticateUser)
	.get(getMe)
	.patch(updateUserValidator, handleValidationErrors, updateUser);

router.get("/", authenticateUser, authorizePermissions("admin"), getAllUsers);

export default router;
