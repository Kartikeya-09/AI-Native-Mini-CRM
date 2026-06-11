import request from 'supertest';
import express from 'express';
import fc from 'fast-check';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import authRouter from './auth.js';
import Marketer from '../models/Marketer.js';
import bcrypt from 'bcrypt';
import { jest } from '@jest/globals';

jest.setTimeout(30000);

describe('Auth routes', () => {
  let mongoServer;
  let app;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Marketer.deleteMany({});
  });

  describe('Property 14: Credential error non-enumeration', () => {
    it('returns identical status and error for unknown email vs wrong password', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6 }),
          fc.string({ minLength: 6 }),
          async (email, correctPassword, wrongPassword) => {
            fc.pre(correctPassword !== wrongPassword);

            // Valid user
            const passwordHash = await bcrypt.hash(correctPassword, 10);
            await Marketer.create({ email, passwordHash });

            // Unknown email scenario
            const resUnknown = await request(app)
              .post('/api/auth/login')
              .send({ email: 'unknown_' + email, password: correctPassword });

            // Wrong password scenario
            const resWrongPwd = await request(app)
              .post('/api/auth/login')
              .send({ email, password: wrongPassword });

            expect(resUnknown.status).toBe(401);
            expect(resUnknown.body.error).toBe('Invalid credentials');
            expect(resWrongPwd.status).toBe(resUnknown.status);
            expect(resWrongPwd.body.error).toBe(resUnknown.body.error);
          }
        ),
        { numRuns: 10 } // reduced for speed in fast-check
      );
    });
  });
});
