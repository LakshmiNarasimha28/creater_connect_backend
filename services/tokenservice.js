import User from "../models/user.js";

export const deductToken = async (userId, amount = 1) => {
	if (!userId) {
		throw new Error("User ID is required");
	}
	if (!Number.isInteger(amount) || amount <= 0) {
		throw new Error("Token amount must be a positive integer");
	}

	const user = await User.findOneAndUpdate(
		{ _id: userId, tokens: { $gte: amount } },
		{ $inc: { tokens: -amount } },
		{ new: true }
	);

	if (!user) {
		throw new Error("Insufficient tokens");
	}

	return user.tokens;
};

export const addTokens = async (userId, amount) => {
	if (!userId) {
		throw new Error("User ID is required");
	}
	if (!Number.isInteger(amount) || amount <= 0) {
		throw new Error("Token amount must be a positive integer");
	}

	const user = await User.findByIdAndUpdate(
		userId,
		{ $inc: { tokens: amount } },
		{ new: true }
	);

	if (!user) {
		throw new Error("User not found");
	}

	return user.tokens;
};
