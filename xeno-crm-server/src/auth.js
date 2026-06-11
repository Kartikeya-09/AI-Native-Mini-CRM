import jwt from 'jsonwebtoken';
import { config } from './config.js';

export const signToken = (marketerId, email) => {
  return jwt.sign({ sub: marketerId.toString(), email }, config.JWT_SECRET, { expiresIn: '24h' });
};

export const withAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    req.marketerId = payload.sub;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
