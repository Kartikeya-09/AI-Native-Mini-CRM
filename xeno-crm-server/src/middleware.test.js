import request from 'supertest';
import express from 'express';
import { withAuth, signToken } from './auth.js';
import mongoose from 'mongoose';

import jwt from 'jsonwebtoken';
import { config } from './config.js';

describe('Property 13: Protected endpoints require auth', () => {
  const app = express();
  app.get('/api/protected', withAuth, (req, res) => {
    res.json({ data: 'secret' });
  });

  it('rejects missing token', async () => {
    const res = await request(app).get('/api/protected');
    expect(res.status).toBe(401);
    expect(res.body.data).toBeUndefined();
  });

  it('rejects malformed token', async () => {
    const res = await request(app).get('/api/protected').set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
    expect(res.body.data).toBeUndefined();
  });

  it('rejects expired token', async () => {
    // Generate an expired token directly
    const token = jwt.sign({ sub: new mongoose.Types.ObjectId(), email: 'test@example.com' }, config.JWT_SECRET, { expiresIn: '-1h' });
    
    const res = await request(app).get('/api/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.data).toBeUndefined();
  });
});
