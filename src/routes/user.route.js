import { Router } from "express";
import {
	getMe,
	getAllUsers,
	updateUser,
	addAddress,
} from "../controllers/index.js";
import {
	authenticateUser,
	authorizePermissions,
	handleValidationErrors,
} from "../middlewares/index.js";
import { updateUserValidator, addressValidator } from "../validators/index.js";

const router = Router();

router
	.route("/me")
	.all(authenticateUser)
	.get(getMe)
	.patch(updateUserValidator, handleValidationErrors, updateUser);

router.post(
	"/me/addresses",
	authenticateUser,
	addressValidator,
	handleValidationErrors,
	addAddress
);

router.get("/", authenticateUser, authorizePermissions("admin"), getAllUsers);

export default router;
