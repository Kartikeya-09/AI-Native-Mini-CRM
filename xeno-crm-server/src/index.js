import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { connectDB } from './db.js';
import authRouter from './routes/auth.js';
import shoppersRouter from './routes/shoppers.js';
import ordersRouter from './routes/orders.js';
import segmentsRouter from './routes/segments.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/shoppers', shoppersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/segments', segmentsRouter);

// TODO: Connect DB and mount routers here

connectDB().then(() => {
  app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
  });
});
