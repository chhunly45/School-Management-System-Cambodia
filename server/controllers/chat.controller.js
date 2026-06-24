const chatService = require('../services/chat.service');

const listChats = async (req, res, next) => {
  try {
    const chats = await chatService.listChats(req.user.id);
    res.json({ success: true, data: chats });
  } catch (error) {
    next(error);
  }
};

const getChat = async (req, res, next) => {
  try {
    const chat = await chatService.getChat(req.params.id, req.user.id);
    res.json({ success: true, data: chat });
  } catch (error) {
    next(error);
  }
};

const createChat = async (req, res, next) => {
  try {
    const { productId, message } = req.body;
    const chat = await chatService.createChat(req.user.id, productId, message);
    res.status(201).json({ success: true, data: chat });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const message = await chatService.sendMessage(req.params.id, req.user.id, req.body.message);
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    await chatService.markAsRead(req.params.id, req.user.id);
    res.json({ success: true, message: 'Chat marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listChats,
  getChat,
  createChat,
  sendMessage,
  markAsRead
};
