const { strict: assert } = require('node:assert');
const { describe, it, before, beforeEach, after } = require('node:test');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;
let chatService;
let User;
let Product;
let Chat;

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  const connectDatabase = require('../config/database');
  await connectDatabase();

  ({ User, Product, Chat } = require('../models'));
  chatService = require('../services/chat.service');
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Chat.deleteMany({})
  ]);
});

describe('chat.service getChat', () => {
  it('allows a buyer participant to fetch their chat', async () => {
    const { Types } = mongoose;
    const buyer = await User.create({
      displayName: 'Buyer User',
      passwordHash: 'password-hash',
      role: 'user'
    });
    const seller = await User.create({
      displayName: 'Seller User',
      passwordHash: 'password-hash',
      role: 'user'
    });
    const product = await Product.create({
      seller: seller._id,
      category: new Types.ObjectId(),
      title: 'Test Product',
      slug: 'test-product',
      description: 'A test product',
      price: 100,
      status: 'published'
    });

    const chat = await Chat.create({
      product: product._id,
      buyer: buyer._id,
      seller: seller._id,
      lastMessageAt: new Date(),
      status: 'active'
    });

    const result = await chatService.getChat(chat._id.toString(), buyer._id.toString());

    assert.equal(result.chat._id.toString(), chat._id.toString());
    assert.equal(result.chat.buyer._id.toString(), buyer._id.toString());
    assert.equal(result.chat.seller._id.toString(), seller._id.toString());
  });

  it('throws 403 when a non-participant requests the chat', async () => {
    const { Types } = mongoose;
    const buyer = await User.create({
      displayName: 'Buyer User',
      passwordHash: 'password-hash',
      role: 'user'
    });
    const seller = await User.create({
      displayName: 'Seller User',
      passwordHash: 'password-hash',
      role: 'user'
    });
    const otherUser = await User.create({
      displayName: 'Unauthorized User',
      passwordHash: 'password-hash',
      role: 'user'
    });
    const product = await Product.create({
      seller: seller._id,
      category: new Types.ObjectId(),
      title: 'Test Product',
      slug: 'test-product',
      description: 'A test product',
      price: 100,
      status: 'published'
    });

    const chat = await Chat.create({
      product: product._id,
      buyer: buyer._id,
      seller: seller._id,
      lastMessageAt: new Date(),
      status: 'active'
    });

    await assert.rejects(
      async () => {
        await chatService.getChat(chat._id.toString(), otherUser._id.toString());
      },
      {
        message: 'Access denied',
        statusCode: 403
      }
    );
  });
});
