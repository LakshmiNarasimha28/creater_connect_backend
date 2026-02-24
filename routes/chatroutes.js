import express from 'express';
import {
  getUsers,
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage
} from '../controllers/chatcontoller.js';
import protect from '../middleware/authmiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all users for starting conversations
router.get('/users', getUsers);

// Get all conversations for current user
router.get('/conversations', getConversations);

// Get or create conversation with specific user
router.get('/conversation/:userId', getOrCreateConversation);

// Get messages for a conversation
router.get('/messages/:conversationId', getMessages);

// Send message (HTTP fallback)
router.post('/send', sendMessage);

export default router;