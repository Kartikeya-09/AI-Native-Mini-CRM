import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'CHANNEL_SERVICE_URL',
  'CHANNEL_SERVICE_TOKEN',
  'REACH_RECEIPT_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const config = {
  PORT: process.env.PORT || 3001,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  CHANNEL_SERVICE_URL: process.env.CHANNEL_SERVICE_URL,
  CHANNEL_SERVICE_TOKEN: process.env.CHANNEL_SERVICE_TOKEN,
  REACH_RECEIPT_URL: process.env.REACH_RECEIPT_URL,
  ATTRIBUTION_WINDOW_DAYS: parseInt(process.env.ATTRIBUTION_WINDOW_DAYS || '7', 10)
};

export { config };
