import Message from '../models/message.js';
import Conversation from '../models/chat.js';
import User from '../models/user.js';

// Get all users except current user
export const getUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const users = await User.find({
      _id: { $ne: currentUserId }
    })
      .select('name email role')
      .sort({ name: 1 });

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// Get or create conversation with a user
export const getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, userId], $size: 2 }
    }).populate('participants', 'name email role');

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [currentUserId, userId]
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email role');
    }

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    res.status(500).json({ success: false, message: 'Failed to get conversation' });
  }
};

// Get all conversations for current user
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
      participants: currentUserId
    })
      .populate('participants', 'name email role')
      .populate('lastMessage')
      .sort({ lastMessageTime: -1 });

    // Filter out invalid conversations
    const validConversations = conversations.filter(conv => {
      if (!conv.participants || conv.participants.length !== 2) return false;
      const ids = conv.participants.map(p => p._id.toString());
      return ids[0] !== ids[1];
    });

    res.status(200).json({ success: true, conversations: validConversations });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .sort({ timestamp: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

// Send message (HTTP fallback)
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, receiverId } = req.body;
    const senderId = req.user._id;

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      receiver: receiverId,
      content
    });

    // Update conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageTime: message.timestamp
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email')
      .populate('receiver', 'name email');

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Only allow sender to delete their own message
    if (message.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ success: true, message: 'Message deleted successfully', messageId });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
};