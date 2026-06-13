import OpenAI from 'openai';
import { config } from '../config.js';

let openaiClient = null;

function getOpenAIClient() {
  if (!openaiClient) {
    const clientOptions = {
      apiKey: config.OPENAI_API_KEY,
    };
    if (config.OPENAI_BASE_URL) {
      clientOptions.baseURL = config.OPENAI_BASE_URL;
    }
    openaiClient = new OpenAI(clientOptions);
  }
  return openaiClient;
}

export { getOpenAIClient };
