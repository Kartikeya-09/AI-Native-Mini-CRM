import jwt from 'jsonwebtoken';
import { config } from './config.js';

export const signToken = (marketerId, email) => {
  return jwt.sign({ sub: marketerId.toString(), email }, config.JWT_SECRET, { expiresIn: '24h' });
};

export const withAuth = (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    // Support for EventSource which cannot set custom headers easily
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    req.marketerId = payload.sub;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
