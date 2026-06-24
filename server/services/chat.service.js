const { Chat, Message, Product, User } = require('../models');

const listChats = async (userId) => {
  const chats = await Chat.find({ $or: [{ buyer: userId }, { seller: userId }] })
    .populate('product', 'title slug')
    .populate('buyer', 'displayName profileImageUrl')
    .populate('seller', 'displayName profileImageUrl')
    .sort({ lastMessageAt: -1 });

  const withLastMessage = await Promise.all(chats.map(async (chat) => {
    const lastMessage = await Message.findOne({ chat: chat.id }).sort({ createdAt: -1 });
    return {
      ...chat.toObject(),
      lastMessage: lastMessage ? {
        content: lastMessage.content,
        sender: lastMessage.sender,
        createdAt: lastMessage.createdAt
      } : null
    };
  }));

  return withLastMessage;
};

const getChat = async (chatId, userId) => {
  const chat = await Chat.findOne({
    _id: chatId,
    $or: [{ buyer: userId }, { seller: userId }]
  })
    .populate('product', 'title slug')
    .populate('buyer', 'displayName profileImageUrl')
    .populate('seller', 'displayName profileImageUrl');

  if (!chat) {
    const existingChat = await Chat.findById(chatId);
    if (!existingChat) {
      const error = new Error('Chat not found');
      error.statusCode = 404;
      throw error;
    }
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  const messages = await Message.find({ chat: chat.id }).sort({ createdAt: 1 });
  return { chat, messages };
};

const createChat = async (buyerId, productId, initialMessage) => {
  const product = await Product.findById(productId);
  if (!product || product.status !== 'published') {
    const error = new Error('Product not available');
    error.statusCode = 404;
    throw error;
  }

  if (product.seller.toString() === buyerId.toString()) {
    const error = new Error('Cannot message your own product');
    error.statusCode = 400;
    throw error;
  }

  let chat = await Chat.findOne({ product: productId, buyer: buyerId, seller: product.seller });
  if (!chat) {
    chat = await Chat.create({
      product: productId,
      buyer: buyerId,
      seller: product.seller,
      lastMessageAt: new Date(),
      status: 'active'
    });
  }

  let message = null;
  if (initialMessage && initialMessage.trim()) {
    message = await Message.create({ chat: chat.id, sender: buyerId, content: initialMessage.trim() });
    chat.lastMessageAt = new Date();
    chat.unreadCount += 1;
    await chat.save();
  }

  return { chat, message };
};

const sendMessage = async (chatId, senderId, content) => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    const error = new Error('Chat not found');
    error.statusCode = 404;
    throw error;
  }

  if (![chat.buyer.toString(), chat.seller.toString()].includes(senderId.toString())) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  const message = await Message.create({ chat: chatId, sender: senderId, content });
  chat.lastMessageAt = new Date();
  chat.unreadCount += 1;
  await chat.save();

  return message;
};

const markAsRead = async (chatId, userId) => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    const error = new Error('Chat not found');
    error.statusCode = 404;
    throw error;
  }

  if (![chat.buyer.toString(), chat.seller.toString()].includes(userId.toString())) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  await Message.updateMany({ chat: chatId, readAt: { $exists: false }, sender: { $ne: userId } }, { readAt: new Date() });
  chat.unreadCount = 0;
  await chat.save();
};

module.exports = {
  listChats,
  getChat,
  createChat,
  sendMessage,
  markAsRead
};
