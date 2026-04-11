const Message = require('../models/Message');
const Chat = require('../models/Chat');

module.exports = (io, socket) => {
  const userId = socket.userId;

  // Join a chat room
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${userId} joined chat ${chatId}`);
  });

  // Leave a chat room
  socket.on('leave_chat', (chatId) => {
    socket.leave(chatId);
  });

  // Send a message
  socket.on('send_message', async (data) => {
    try {
      const { chatId, text } = data;
      if (!chatId || !text?.trim()) return;

      const message = await Message.create({
        chatId,
        senderId: userId,
        text: text.trim(),
        sentAt: new Date(),
        deliveredAt: new Date(),
      });

      // Update chat's last message
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: text.trim().substring(0, 100),
        lastMessageAt: new Date(),
      });

      const populated = await Message.findById(message._id)
        .populate('senderId', 'name avatar');

      // Emit to everyone in the room
      io.to(chatId).emit('new_message', populated);

      // Send delivery receipt to sender
      socket.emit('message_delivered', {
        messageId: message._id,
        deliveredAt: message.deliveredAt,
      });
    } catch (err) {
      console.error('Error sending message:', err.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Mark messages as read
  socket.on('messages_read', async (data) => {
    try {
      const { chatId } = data;
      const now = new Date();

      await Message.updateMany(
        { chatId, senderId: { $ne: userId }, readAt: null },
        { readAt: now }
      );

      // Notify the other participant
      socket.to(chatId).emit('messages_read_receipt', {
        chatId,
        readBy: userId,
        readAt: now,
      });
    } catch (err) {
      console.error('Error marking messages read:', err.message);
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('user_typing', {
      chatId: data.chatId,
      userId,
    });
  });

  socket.on('stop_typing', (data) => {
    socket.to(data.chatId).emit('user_stop_typing', {
      chatId: data.chatId,
      userId,
    });
  });
};
