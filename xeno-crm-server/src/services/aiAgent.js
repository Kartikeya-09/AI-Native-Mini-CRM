import { getOpenAIClient } from '../lib/openai.js';

const MODEL = 'gpt-4o-mini';

/**
 * Convert a natural-language audience description into FilterCriteria JSON.
 * Returns { filterCriteria, humanReadableSummary } or { needsClarification, question }.
 */
export async function segmentIntent(prompt, history = []) {
  const openai = getOpenAIClient();

  const systemMessage = `You are an expert CRM segmentation assistant.
Convert the user's natural-language audience description into a FilterCriteria JSON object.

FilterCriteria schema:
{
  "logic": "AND" | "OR",
  "clauses": [
    {
      "type": "attribute" | "directField" | "orderCount" | "totalSpend" | "lastOrderDate" | "productCategory",
      "field": "<string, required for attribute and directField types>",
      "operator": "<string, e.g. eq, ne, gt, gte, lt, lte, contains, in>",
      "value": "<appropriate type>"
    }
  ]
}

Rules:
- If the request is clear, respond with JSON: { "filterCriteria": { ... }, "humanReadableSummary": "..." }
- If the request is ambiguous or missing key details, respond with JSON: { "needsClarification": true, "question": "..." }
- Always return valid JSON and nothing else.`;

  const messages = [
    { role: 'system', content: systemMessage },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: prompt },
  ];

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages,
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Convert a natural-language campaign brief into structured campaign plan JSON.
 * Returns { segmentCriteria, channel, template, name }.
 */
export async function campaignIntent(prompt, history = []) {
  const openai = getOpenAIClient();

  const systemMessage = `You are an expert CRM campaign planner.
Convert the user's natural-language campaign description into a structured campaign plan JSON object.

Response schema:
{
  "segmentCriteria": {
    "logic": "AND" | "OR",
    "clauses": [ { "type": "...", "field": "...", "operator": "...", "value": "..." } ]
  },
  "channel": "email" | "sms" | "push",
  "template": "<message template string, may include placeholders like {{firstName}}>",
  "name": "<short campaign name>"
}

Always return valid JSON and nothing else.`;

  const messages = [
    { role: 'system', content: systemMessage },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: prompt },
  ];

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages,
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Revise an existing campaign plan based on user feedback.
 * Returns a revised campaign plan object.
 */
export async function revisePlan(plan, feedback, history = []) {
  const openai = getOpenAIClient();

  const systemMessage = `You are an expert CRM campaign planner.
The user has an existing campaign plan and wants to revise it based on their feedback.
Return the full revised campaign plan as a JSON object with the same schema:
{
  "segmentCriteria": { "logic": "AND"|"OR", "clauses": [...] },
  "channel": "email" | "sms" | "push",
  "template": "<message template string>",
  "name": "<campaign name>"
}

Always return valid JSON and nothing else.`;

  const messages = [
    { role: 'system', content: systemMessage },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    {
      role: 'user',
      content: `Current plan:\n${JSON.stringify(plan, null, 2)}\n\nFeedback:\n${feedback}`,
    },
  ];

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages,
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Replace template placeholders with per-shopper values.
 * Pure string substitution — no OpenAI call.
 * Returns an array of personalised message strings.
 */
export function personalise(template, shoppers) {
  return shoppers.map((shopper) => {
    let message = template;

    message = message.replace(/\{\{firstName\}\}/g, shopper.firstName || '');
    message = message.replace(/\{\{lastName\}\}/g, shopper.lastName || '');
    message = message.replace(/\{\{email\}\}/g, shopper.email || '');

    // Attributes-based placeholders
    const attrs = shopper.attributes || {};
    message = message.replace(/\{\{productCategory\}\}/g, attrs.productCategory || '');
    message = message.replace(/\{\{loyaltyTier\}\}/g, attrs.loyaltyTier || '');
    message = message.replace(/\{\{city\}\}/g, attrs.city || '');

    return message;
  });
}

/**
 * Generate a 1-3 sentence plain-language performance summary from CampaignStats.
 */
export async function performanceSummary(stats) {
  const openai = getOpenAIClient();

  const systemMessage = `You are a marketing analytics assistant.
Given campaign performance statistics, produce a concise 1-3 sentence plain-language summary.
Focus on delivery rate, engagement, and revenue impact. Be specific with numbers.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: JSON.stringify(stats, null, 2) },
    ],
  });

  return response.choices[0].message.content.trim();
}

/**
 * Generate a side-by-side natural-language comparison of two CampaignStats objects.
 */
export async function compareCampaigns(statsA, statsB) {
  const openai = getOpenAIClient();

  const systemMessage = `You are a marketing analytics assistant.
Given two sets of campaign performance statistics (Campaign A and Campaign B), produce a concise
side-by-side natural-language comparison. Highlight which campaign performed better on key metrics
like delivery rate, open rate, click rate, and attributed revenue. Be specific with numbers.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemMessage },
      {
        role: 'user',
        content: `Campaign A:\n${JSON.stringify(statsA, null, 2)}\n\nCampaign B:\n${JSON.stringify(statsB, null, 2)}`,
      },
    ],
  });

  return response.choices[0].message.content.trim();
}
