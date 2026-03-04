import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import Message from '../models/message.js';
import Conversation from '../models/chat.js';
import { deductToken } from '../services/tokenservice.js';
import { getOrCreateConversationService } from '../services/chatservice.js';
import { pubclient, subclient } from '../config/redis.js';

const connectedUsers = new Map();
let ioInstance = null;

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true
    }
  });

  // Use Redis adapter if Redis is connected
  if (pubclient && subclient) {
    io.adapter(createAdapter(pubclient, subclient));
    console.log('Socket.IO using Redis adapter for horizontal scaling');
  } else {
    console.log('Socket.IO running without Redis (single-instance mode)');
  }

  
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    
    connectedUsers.set(socket.userId, socket.id);

    
    io.emit('user-online', socket.userId);

    
    socket.join(socket.userId);

    
    socket.on('send-message', async (data) => {
      try {
        const { conversationId, receiverId, content } = data;

        if (!receiverId) {
          return socket.emit('message-error', { message: 'Receiver is required' });
        }

        if (!content || !content.trim()) {
          return socket.emit('message-error', { message: 'Message content is required' });
        }

        let activeConversationId = conversationId;
        if (!activeConversationId) {
          const conversation = await getOrCreateConversationService(socket.userId, receiverId);
          activeConversationId = conversation._id;
        }

        await deductToken(socket.userId, 1);

        
        const message = await Message.create({
          conversation: activeConversationId,
          sender: socket.userId,
          receiver: receiverId,
          content: content.trim()
        });

        
        await Conversation.findByIdAndUpdate(activeConversationId, {
          lastMessage: message._id,
          lastMessageTime: message.timestamp
        });

        
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name email')
          .populate('receiver', 'name email');

        
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive-message', populatedMessage);
        }

        
        socket.emit('message-sent', populatedMessage);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message-error', { message: 'Failed to send message' });
      }
    });

    
    socket.on('typing', (data) => {
      const { receiverId, conversationId } = data;
      const receiverSocketId = connectedUsers.get(receiverId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user-typing', {
          userId: socket.userId,
          conversationId
        });
      }
    });

    
    socket.on('stop-typing', (data) => {
      const { receiverId, conversationId } = data;
      const receiverSocketId = connectedUsers.get(receiverId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user-stopped-typing', {
          userId: socket.userId,
          conversationId
        });
      }
    });

    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      connectedUsers.delete(socket.userId);
      
      
      io.emit('user-offline', socket.userId);
    });
  });

  ioInstance = io;
  return io;
};

export const getIo = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized');
  }
  return ioInstance;
};

export const getConnectedUsers = () => {
  return Array.from(connectedUsers.keys());
};