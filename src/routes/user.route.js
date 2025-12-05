import { Router } from "express";
import {
	getMe,
	getAllUsers,
	updateUser,
	addAddress,
	updateAddress,
	deleteAddress,
} from "../controllers/index.js";
import {
	authenticateUser,
	authorizePermissions,
	handleValidationErrors,
} from "../middlewares/index.js";
import {
	updateUserValidator,
	addAddressValidator,
	updateAddressValidator,
} from "../validators/index.js";

const router = Router();

router
	.route("/me")
	.all(authenticateUser)
	.get(getMe)
	.patch(updateUserValidator, handleValidationErrors, updateUser);

router.post(
	"/me/addresses",
	authenticateUser,
	addAddressValidator,
	handleValidationErrors,
	addAddress
);

router.patch(
	"/me/addresses/:addressId",
	authenticateUser,
	updateAddressValidator,
	handleValidationErrors,
	updateAddress
);

router.delete("/me/addresses/:addressId", authenticateUser, deleteAddress);

router.get("/", authenticateUser, authorizePermissions("admin"), getAllUsers);

export default router;
