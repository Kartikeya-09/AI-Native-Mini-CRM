import 'dotenv/config';
import express from 'express';
import { sendRouter } from './routes/send.js';
import { statusRouter } from './routes/status.js';

const app = express();
app.use(express.json());

// Mount routes
app.use('/send', sendRouter);
app.use('/status', statusRouter);

const PORT = process.env.CS_PORT || 3002;

app.listen(PORT, () => {
  console.log(`Channel service running on port ${PORT}`);
});
