import { StatusCodes } from "http-status-codes";
import User from "../models/user.model.js";
import { logger, sendResponse } from "../utils/index.js";
import { NotFoundError, BadRequestError } from "../errors/index.js";
import { config } from "../config/index.js";

export const getMe = async (req, res, next) => {
	try {
		const user = await User.findOne({ userId: req.user.userId });
		if (!user) {
			throw new NotFoundError(`No user found with id: ${req.user.userId}`);
		}

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "User profile fetched successfully.",
				data: user,
			})
		);
	} catch (error) {
		next(error);
	}
};

export const getAllUsers = async (req, res, next) => {
	try {
		const users = await User.find({});
		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "All users fetched successfully.",
				data: { users, count: users.length },
			})
		);
	} catch (error) {
		next(error);
	}
};

export const updateUser = async (req, res, next) => {
	try {
		const { userId } = req.user;
		const requestData = req.body || {};

		const allowedFields = ["firstName", "lastName", "phone", "gender"];
		const updateData = {};

		Object.entries(requestData).forEach(([key, value]) => {
			if (!allowedFields.includes(key)) return;

			if (key === "firstName") updateData["name.first"] = value;
			else if (key === "lastName") updateData["name.last"] = value;
			else updateData[key] = value;
		});

		if (Object.keys(updateData).length === 0) {
			return res.status(StatusCodes.BAD_REQUEST).json(
				sendResponse({
					success: false,
					message: "No valid fields provided for update",
				})
			);
		}

		const user = await User.findOneAndUpdate(
			{ userId },
			{ $set: updateData },
			{
				new: true,
				runValidators: true,
				select: "-password -refreshTokens",
			}
		);

		if (!user) {
			throw new NotFoundError(`No user found with id: ${userId}`);
		}

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "User profile updated successfully.",
				data: user,
			})
		);
	} catch (error) {
		next(error);
	}
};

export const addAddress = async (req, res, next) => {
	try {
		const { userId } = req.user;

		const user = await User.findOne({ userId });
		if (!user) {
			throw new NotFoundError(`No user found with id: ${userId}`);
		}
		if (user.addresses.length >= config.maxAddressesPerUser) {
			throw new BadRequestError(
				`You can only store up to ${config.maxAddressesPerUser} addresses.`
			);
		}

		const labelExists = user.addresses.some(
			(addr) => addr.label.toLowerCase() === req.body.label.toLowerCase()
		);
		if (labelExists) {
			throw new BadRequestError(
				`An address with the label '${req.body.label}' already exists.`
			);
		}

		user.addresses.push(req.body);
		const updatedUser = await user.save();

		return res.status(StatusCodes.CREATED).json(
			sendResponse({
				success: true,
				message: "Address added successfully.",
				data: updatedUser.addresses,
			})
		);
	} catch (error) {
		next(error);
	}
};

export const updateAddress = async (req, res, next) => {
	try {
		const { userId } = req.user;
		const { addressId } = req.params;

		if (req.body.label) {
			const newLabel = req.body.label.toLowerCase();
			const user = await User.findOne({
				userId,
				"addresses.label": newLabel,
				"addresses.addressId": { $ne: addressId },
			});

			if (user) {
				throw new BadRequestError(
					`An address with the label '${req.body.label}' already exists.`
				);
			}
		}

		const allowedFields = ["label", "area", "city", "state", "postalCode"];
		const updateFields = {};
		allowedFields.forEach((field) => {
			if (req.body[field] !== undefined) {
				updateFields[`addresses.$.${field}`] = req.body[field];
			}
		});

		if (Object.keys(updateFields).length === 0) {
			throw new BadRequestError("No valid fields provided for update.");
		}

		const updatedUser = await User.findOneAndUpdate(
			{ userId, "addresses.addressId": addressId },
			{ $set: updateFields },
			{ new: true }
		);
		if (!updatedUser) {
			throw new NotFoundError(`No address found with id: ${addressId}`);
		}

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "Address updated successfully.",
				data: updatedUser.addresses,
			})
		);
	} catch (error) {
		next(error);
	}
};

export const deleteAddress = async (req, res, next) => {
	try {
		const { userId } = req.user;
		const { addressId } = req.params;

		const user = await User.findOne({ userId });
		if (!user) {
			throw new NotFoundError(`No user found with id: ${userId}`);
		}
		if (user.addresses.length === 1) {
			throw new BadRequestError(
				"You cannot delete your last remaining address."
			);
		}

		const addressIndex = user.addresses.findIndex(
			(addr) => addr.addressId === addressId
		);
		if (addressIndex === -1) {
			throw new NotFoundError(`No address found with id: ${addressId}`);
		}

		user.addresses.splice(addressIndex, 1);
		await user.save();

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "Address deleted successfully.",
				data: user.addresses,
			})
		);
	} catch (error) {
		next(error);
	}
};
