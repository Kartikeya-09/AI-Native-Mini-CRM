import express from 'express';
import bcrypt from 'bcrypt';
import Marketer from '../models/Marketer.js';
import { signToken } from '../auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const marketer = new Marketer({ email, passwordHash });
    await marketer.save();

    const token = signToken(marketer._id, marketer.email);
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

    res.status(201).json({ token, expiresAt: new Date(payload.exp * 1000).toISOString() });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const marketer = await Marketer.findOne({ email });
    if (!marketer) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, marketer.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(marketer._id, marketer.email);
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

    res.status(200).json({ token, expiresAt: new Date(payload.exp * 1000).toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;