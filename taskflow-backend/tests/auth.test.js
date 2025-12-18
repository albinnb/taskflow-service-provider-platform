import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/authRoutes.js';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Provider from '../src/models/Provider.js';
import { notFound, errorHandler } from '../src/middleware/errorHandler.js';
import dotenv from 'dotenv';

dotenv.config();

// Mock the Express app for testing purposes
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(notFound);
app.use(errorHandler);

// Set up a mock database connection/cleanup
beforeAll(async () => {
  // Use a different test database URI if needed, but for simplicity, use the dev one
  // await connectDB(); // Omit real connection unless necessary for true integration tests
  await User.deleteMany({});
  await Provider.deleteMany({});
});

afterAll(async () => {
  await User.deleteMany({});
  await Provider.deleteMany({});
});

describe('Auth Endpoints', () => {
  const testUser = {
    name: 'Test Customer',
    email: 'test@customer.com',
    password: 'password123',
    role: 'customer',
  };

  const testProvider = {
    name: 'Test Provider',
    email: 'test@provider.com',
    password: 'password123',
    role: 'provider',
  };

  // --- Register Tests ---
  it('POST /api/auth/register should register a new customer', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('role', 'customer');
    expect(res.header['set-cookie'][0]).toContain('token=');
  });

  it('POST /api/auth/register should register a new provider and create a provider profile', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testProvider);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('role', 'provider');

    // Verify Provider profile was created
    const user = await User.findOne({ email: testProvider.email });
    const provider = await Provider.findOne({ userId: user._id });
    expect(provider).not.toBeNull();
    expect(provider.businessName).toContain('Test Provider');
  });

  it('POST /api/auth/register should return 400 for duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser); // Send again

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'User already exists');
  });

  // --- Login Tests ---
  it('POST /api/auth/login should log in the customer successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('role', 'customer');
    expect(res.header['set-cookie'][0]).toContain('token=');
  });

  it('POST /api/auth/login should return 401 for incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'Invalid email or password');
  });

  // --- Get Me Tests (Requires token) ---
  it('GET /api/auth/me should return 401 if no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toEqual(401);
  });
});