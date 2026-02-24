import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from '../models/message.js';
import Conversation from '../models/chat.js';


const connectedUsers = new Map();

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true
    }
  });

  
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

        
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          receiver: receiverId,
          content
        });

        
        await Conversation.findByIdAndUpdate(conversationId, {
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

  return io;
};

export const getConnectedUsers = () => {
  return Array.from(connectedUsers.keys());
};