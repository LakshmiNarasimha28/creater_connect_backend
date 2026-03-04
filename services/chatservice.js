import Conversation from "../models/chat.js";

export const getOrCreateConversationService = async (currentUserId, otherUserId) => {
	if (!currentUserId || !otherUserId) {
		throw new Error("Both user IDs are required");
	}

	let conversation = await Conversation.findOne({
		participants: { $all: [currentUserId, otherUserId], $size: 2 }
	});

	if (!conversation) {
		conversation = await Conversation.create({
			participants: [currentUserId, otherUserId]
		});
	}

	return conversation;
};
