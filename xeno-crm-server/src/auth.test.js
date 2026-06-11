import jwt from 'jsonwebtoken';
import { signToken } from './auth.js';
import { config } from './config.js';
import mongoose from 'mongoose';

describe('Property 15: Session token expiry correctness', () => {
  it('should issue tokens with exp = iat + 86400', () => {
    const marketerId = new mongoose.Types.ObjectId();
    const token = signToken(marketerId, 'test@example.com');
    const payload = jwt.verify(token, config.JWT_SECRET);
    
    expect(payload.exp).toBe(payload.iat + 86400);
  });
});
