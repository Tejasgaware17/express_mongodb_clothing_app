import { StatusCodes } from "http-status-codes";
import { Category } from "../models/index.js";
import { sendResponse } from "../utils/index.js";
import { BadRequestError } from "../errors/index.js";

export const createCategory = async (req, res, next) => {
	try {
		const { name, description } = req.body;

		const category = await Category.create({ name, description });

		return res.status(StatusCodes.CREATED).json(
			sendResponse({
				success: true,
				message: "Category created successfully.",
				data: category,
			})
		);
	} catch (error) {
		next(error);
	}
};
