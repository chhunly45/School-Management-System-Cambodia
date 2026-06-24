const { strict: assert } = require('node:assert');
const { describe, it, before, after } = require('node:test');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  const connectDatabase = require('../config/database');
  await connectDatabase();
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

describe('Chat and Message models', () => {
  it('can create a Chat and Message document', async () => {
    const { Chat, Message } = require('../models');
    const { Types } = mongoose;

    const productId = new Types.ObjectId();
    const buyerId = new Types.ObjectId();
    const sellerId = new Types.ObjectId();

    const chat = await Chat.create({ product: productId, buyer: buyerId, seller: sellerId });
    assert.ok(chat._id, 'chat created');
    assert.equal(chat.product.toString(), productId.toString());

    const message = await Message.create({ chat: chat._id, sender: buyerId, content: 'Hello seller' });
    assert.ok(message._id, 'message created');
    assert.equal(message.chat.toString(), chat._id.toString());
    assert.equal(message.content, 'Hello seller');

    // update chat lastMessageAt when message created
    chat.lastMessageAt = message.createdAt || message.updatedAt || new Date();
    await chat.save();
    const reloaded = await Chat.findById(chat._id);
    assert.ok(reloaded.lastMessageAt, 'lastMessageAt set');
  });
});
