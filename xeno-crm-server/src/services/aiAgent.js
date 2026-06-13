import { getOpenAIClient } from '../lib/openai.js';
import { config } from '../config.js';

const MODEL = config.OPENAI_MODEL;

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
      "type": "attribute" | "last_order_date" | "order_count" | "total_spend" | "product_category" | "days_since_last_order",
      "field": "<string, required for attribute type>",
      "operator": "<string, e.g. eq, gt, gte, lt, lte, contains, before, after>",
      "value": "<appropriate type>"
    }
  ]
}

IMPORTANT - Clause types:
Each clause type has DIFFERENT field names and operators:

- "attribute": Use format { "type": "attribute", "key": "attributeName", "op": "eq" or "contains", "value": "value" }
  Example: { "type": "attribute", "key": "city", "op": "eq", "value": "New York" }
  Available attribute keys: "city", "loyaltyTier". Use "city" for location/state/region, NOT "state".

- "last_order_date": Use format { "type": "last_order_date", "op": "before" or "after", "value": "ISODateString" }
  Example: { "type": "last_order_date", "op": "before", "value": "2026-01-01T00:00:00Z" }
  IMPORTANT: Always use 2026 for dates. For "last month", use "2026-05-01" to "2026-06-01".

- "order_count": Use format { "type": "order_count", "dateRange": { "from": "ISODate", "to": "ISODate" }, "min": number, "max": number }
  Examples:
  - "more than 5 orders" → { "type": "order_count", "min": 5 }
  - "less than 10 orders" → { "type": "order_count", "max": 10 }
  - "between 5 and 10 orders" → { "type": "order_count", "min": 5, "max": 10 }
  - "at least 5 orders" → { "type": "order_count", "min": 5 }
  IMPORTANT: For date ranges, always use 2026 (e.g., "2026-05-01" to "2026-06-01").

- "total_spend": Use format { "type": "total_spend", "dateRange": { "from": "ISODate", "to": "ISODate" }, "min": number, "max": number }
  Examples:
  - "spent more than $500" → { "type": "total_spend", "min": 500 }
  - "spent less than $1000" → { "type": "total_spend", "max": 1000 }
  - "spent between $500 and $1000" → { "type": "total_spend", "min": 500, "max": 1000 }
  - "spent at least $500" → { "type": "total_spend", "min": 500 }
  IMPORTANT: For date ranges, always use 2026. For "last month" use "2026-05-01" to "2026-06-01".

- "product_category": Use format { "type": "product_category", "category": "categoryName", "purchased": true }
  Example: { "type": "product_category", "category": "electronics", "purchased": true }

- "days_since_last_order": Use format { "type": "days_since_last_order", "op": "gt" or "lt", "value": number }
  Example: { "type": "days_since_last_order", "op": "gt", "value": 30 }

DO NOT mix field names between clause types. Each type has its own specific format.
IMPORTANT: For location filtering, ALWAYS use key "city", never "state", "region", or "location".

Rules:
- If the request is clear, respond with JSON: { "filterCriteria": { ... }, "humanReadableSummary": "..." }
- If the request is ambiguous or missing key details, respond with JSON: { "needsClarification": true, "question": "..." }
- Always return valid JSON and nothing else.`;

  // Validate and filter history to ensure all messages have role and content
  const validHistory = Array.isArray(history) ? history.filter(h => h && h.role && h.content) : [];

  const messages = [
    { role: 'system', content: systemMessage },
    ...validHistory.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: prompt },
  ];

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages,
  });

  const result = JSON.parse(response.choices[0].message.content);

  // Validate and normalize clause types and transform field names
  const validClauseTypes = ['attribute', 'last_order_date', 'order_count', 'total_spend', 'product_category', 'days_since_last_order'];
  const clauseTypeMappings = {
    'equals': 'attribute',
    'equal': 'attribute',
    'greater': 'order_count',
    'less': 'order_count',
    'date': 'last_order_date',
    'spending': 'total_spend',
    'category': 'product_category',
    'directfield': 'attribute',
    'ordercount': 'order_count',
    'totalspend': 'total_spend',
    'lastorderdate': 'last_order_date',
    'productcategory': 'product_category',
    'dayssincelastorder': 'days_since_last_order',
  };

  if (result.filterCriteria && result.filterCriteria.clauses) {
    result.filterCriteria.clauses = result.filterCriteria.clauses.map(clause => {
      if (!clause.type) return clause;

      const normalizedType = clause.type.toLowerCase().trim();
      // Check if it's a direct match
      if (validClauseTypes.includes(normalizedType)) {
        clause.type = normalizedType;
      }
      // Check if it's in our mappings
      else if (clauseTypeMappings[normalizedType]) {
        clause.type = clauseTypeMappings[normalizedType];
      }
      // Smart detection based on field/key name (even if type is already valid)
      else {
        clause.type = 'attribute'; // default
      }

      // Smart detection: override type if field/key suggests different type
      const fieldName = (clause.key || clause.field || '').toLowerCase();
      if (fieldName.includes('order') && fieldName.includes('count') && clause.type !== 'order_count') {
        clause.type = 'order_count';
      } else if (fieldName.includes('total') && fieldName.includes('spend') && clause.type !== 'total_spend') {
        clause.type = 'total_spend';
      } else if (fieldName.includes('product') && fieldName.includes('categor') && clause.type !== 'product_category') {
        clause.type = 'product_category';
      } else if (fieldName.includes('last') && fieldName.includes('order') && fieldName.includes('date') && clause.type !== 'last_order_date') {
        clause.type = 'last_order_date';
      } else if (fieldName.includes('day') && fieldName.includes('since') && fieldName.includes('last') && clause.type !== 'days_since_last_order') {
        clause.type = 'days_since_last_order';
      }

      // Transform field names based on clause type
      // Handle uniform format { field, operator, value } -> specific formats
      // Also handle cases where AI put right fields but wrong type
      if (clause.field || (clause.type !== 'attribute' && clause.key)) {
        const operator = clause.operator;
        const value = clause.value;

        switch (clause.type) {
          case 'attribute':
            clause.key = clause.field || clause.key;
            // Map common location field names to "city"
            const locationMappings = {
              'state': 'city',
              'region': 'city',
              'location': 'city',
              'address': 'city',
            };
            if (locationMappings[clause.key?.toLowerCase()]) {
              clause.key = locationMappings[clause.key.toLowerCase()];
            }
            clause.op = operator;
            clause.value = value;
            delete clause.field;
            delete clause.operator;
            delete clause.dateRange;
            delete clause.min;
            delete clause.max;
            delete clause.category;
            delete clause.purchased;
            break;
          case 'last_order_date':
            clause.op = operator || clause.op;
            clause.value = value || clause.value;
            delete clause.field;
            delete clause.operator;
            delete clause.key;
            delete clause.dateRange;
            delete clause.min;
            delete clause.max;
            delete clause.category;
            delete clause.purchased;
            break;
          case 'days_since_last_order':
            clause.op = operator || clause.op;
            clause.value = value || clause.value;
            delete clause.field;
            delete clause.operator;
            delete clause.key;
            delete clause.dateRange;
            delete clause.min;
            delete clause.max;
            delete clause.category;
            delete clause.purchased;
            break;
          case 'product_category':
            clause.category = clause.category || value || clause.field;
            clause.purchased = clause.purchased !== undefined ? clause.purchased : true;
            delete clause.field;
            delete clause.operator;
            delete clause.value;
            delete clause.key;
            delete clause.dateRange;
            delete clause.min;
            delete clause.max;
            break;
          case 'order_count':
          case 'total_spend':
            // Keep existing structure if already correct, otherwise transform
            if (!clause.min && !clause.max && operator) {
              // Try to convert operator to min/max
              if (operator === 'gt' || operator === 'gte') {
                clause.min = value;
              } else if (operator === 'lt' || operator === 'lte') {
                clause.max = value;
              } else if (operator === 'eq') {
                clause.min = value;
                clause.max = value;
              }
            }
            delete clause.field;
            delete clause.operator;
            delete clause.value;
            delete clause.key;
            delete clause.op;
            delete clause.category;
            delete clause.purchased;
            break;
        }
      }

      // Ensure required fields exist for each type
      switch (clause.type) {
        case 'attribute':
          // Map invalid operators to valid ones for attribute clauses
          const validAttributeOperators = ['eq', 'contains'];
          const attributeOperatorMappings = {
            'gt': 'eq',
            'gte': 'eq',
            'lt': 'eq',
            'lte': 'eq',
            'equals': 'eq',
            'equal': 'eq',
          };
          if (clause.op && !validAttributeOperators.includes(clause.op)) {
            clause.op = attributeOperatorMappings[clause.op.toLowerCase()] || 'eq';
          }
          if (!clause.op) clause.op = 'eq';
          if (!clause.key && clause.field) clause.key = clause.field;
          // Map common location field names to "city" (fallback)
          const locationMappings = {
            'state': 'city',
            'region': 'city',
            'location': 'city',
            'address': 'city',
          };
          if (locationMappings[clause.key?.toLowerCase()]) {
            clause.key = locationMappings[clause.key.toLowerCase()];
          }
          break;
        case 'last_order_date':
          if (!clause.op) clause.op = 'before';
          break;
        case 'days_since_last_order':
          if (!clause.op) clause.op = 'gt';
          break;
        case 'product_category':
          if (!clause.category) clause.category = clause.value || clause.field || 'unknown';
          if (clause.purchased === undefined) clause.purchased = true;
          break;
        case 'order_count':
        case 'total_spend':
          if (clause.min === undefined && clause.max === undefined) {
            clause.min = 0; // Default if no bounds specified
          }
          break;
      }

      return clause;
    });
  }

  return result;
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

IMPORTANT - Clause types (for segmentCriteria.clauses):
Each clause type has DIFFERENT field names and operators:

- "attribute": Use format { "type": "attribute", "key": "attributeName", "op": "eq" or "contains", "value": "value" }
  Example: { "type": "attribute", "key": "city", "op": "eq", "value": "New York" }
  Available attribute keys: "city", "loyaltyTier". Use "city" for location/state/region, NOT "state".

- "last_order_date": Use format { "type": "last_order_date", "op": "before" or "after", "value": "ISODateString" }
  Example: { "type": "last_order_date", "op": "before", "value": "2026-01-01T00:00:00Z" }
  IMPORTANT: Always use 2026 for dates. For "last month", use "2026-05-01" to "2026-06-01".

- "order_count": Use format { "type": "order_count", "dateRange": { "from": "ISODate", "to": "ISODate" }, "min": number, "max": number }
  Examples:
  - "more than 5 orders" → { "type": "order_count", "min": 5 }
  - "less than 10 orders" → { "type": "order_count", "max": 10 }
  - "between 5 and 10 orders" → { "type": "order_count", "min": 5, "max": 10 }
  - "at least 5 orders" → { "type": "order_count", "min": 5 }
  IMPORTANT: For date ranges, always use 2026 (e.g., "2026-05-01" to "2026-06-01").

- "total_spend": Use format { "type": "total_spend", "dateRange": { "from": "ISODate", "to": "ISODate" }, "min": number, "max": number }
  Examples:
  - "spent more than $500" → { "type": "total_spend", "min": 500 }
  - "spent less than $1000" → { "type": "total_spend", "max": 1000 }
  - "spent between $500 and $1000" → { "type": "total_spend", "min": 500, "max": 1000 }
  - "spent at least $500" → { "type": "total_spend", "min": 500 }
  IMPORTANT: For date ranges, always use 2026. For "last month" use "2026-05-01" to "2026-06-01".

- "product_category": Use format { "type": "product_category", "category": "categoryName", "purchased": true }
  Example: { "type": "product_category", "category": "electronics", "purchased": true }

- "days_since_last_order": Use format { "type": "days_since_last_order", "op": "gt" or "lt", "value": number }
  Example: { "type": "days_since_last_order", "op": "gt", "value": 30 }

DO NOT mix field names between clause types. Each type has its own specific format.
IMPORTANT: For location filtering, ALWAYS use key "city", never "state", "region", or "location".

IMPORTANT - Channel:
The channel MUST be exactly one of: "email", "sms", or "push". Do not use any other channel names like whatsapp, telegram, etc.
If the user mentions whatsapp or similar, map it to "sms".
If the user mentions email, use "email".
If the user mentions notifications or mobile app, use "push".

Always return valid JSON and nothing else.`;

  // Validate and filter history to ensure all messages have role and content
  const validHistory = Array.isArray(history) ? history.filter(h => h && h.role && h.content) : [];

  const messages = [
    { role: 'system', content: systemMessage },
    ...validHistory.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: prompt },
  ];

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages,
  });

  const result = JSON.parse(response.choices[0].message.content);

  // Validate and normalize channel
  const validChannels = ['email', 'sms', 'push'];
  const channelMappings = {
    'whatsapp': 'sms',
    'telegram': 'sms',
    'text': 'sms',
    'message': 'sms',
    'notification': 'push',
    'notifications': 'push',
    'mobile': 'push',
    'app': 'push',
    'mail': 'email',
  };

  if (result.channel) {
    const normalizedChannel = result.channel.toLowerCase().trim();
    // Check if it's a direct match
    if (validChannels.includes(normalizedChannel)) {
      result.channel = normalizedChannel;
    }
    // Check if it's in our mappings
    else if (channelMappings[normalizedChannel]) {
      result.channel = channelMappings[normalizedChannel];
    }
    // Default to email if still invalid
    else {
      result.channel = 'email';
    }
  }

  // Validate and normalize clause types and transform field names
  const validClauseTypes = ['attribute', 'last_order_date', 'order_count', 'total_spend', 'product_category', 'days_since_last_order'];
  const clauseTypeMappings = {
    'equals': 'attribute',
    'equal': 'attribute',
    'greater': 'order_count',
    'less': 'order_count',
    'date': 'last_order_date',
    'spending': 'total_spend',
    'category': 'product_category',
    'directfield': 'attribute',
    'ordercount': 'order_count',
    'totalspend': 'total_spend',
    'lastorderdate': 'last_order_date',
    'productcategory': 'product_category',
    'dayssincelastorder': 'days_since_last_order',
  };

  if (result.segmentCriteria && result.segmentCriteria.clauses) {
    result.segmentCriteria.clauses = result.segmentCriteria.clauses.map(clause => {
      if (!clause.type) return clause;

      const normalizedType = clause.type.toLowerCase().trim();
      // Check if it's a direct match
      if (validClauseTypes.includes(normalizedType)) {
        clause.type = normalizedType;
      }
      // Check if it's in our mappings
      else if (clauseTypeMappings[normalizedType]) {
        clause.type = clauseTypeMappings[normalizedType];
      }
      // Smart detection based on field/key name (even if type is already valid)
      else {
        clause.type = 'attribute'; // default
      }

      // Smart detection: override type if field/key suggests different type
      const fieldName = (clause.key || clause.field || '').toLowerCase();
      if (fieldName.includes('order') && fieldName.includes('count') && clause.type !== 'order_count') {
        clause.type = 'order_count';
      } else if (fieldName.includes('total') && fieldName.includes('spend') && clause.type !== 'total_spend') {
        clause.type = 'total_spend';
      } else if (fieldName.includes('product') && fieldName.includes('categor') && clause.type !== 'product_category') {
        clause.type = 'product_category';
      } else if (fieldName.includes('last') && fieldName.includes('order') && fieldName.includes('date') && clause.type !== 'last_order_date') {
        clause.type = 'last_order_date';
      } else if (fieldName.includes('day') && fieldName.includes('since') && fieldName.includes('last') && clause.type !== 'days_since_last_order') {
        clause.type = 'days_since_last_order';
      }

      // Transform field names based on clause type
      // Handle uniform format { field, operator, value } -> specific formats
      // Also handle cases where AI put right fields but wrong type
      if (clause.field || (clause.type !== 'attribute' && clause.key)) {
        const operator = clause.operator;
        const value = clause.value;

        switch (clause.type) {
          case 'attribute':
            clause.key = clause.field || clause.key;
            // Map common location field names to "city"
            const locationMappings = {
              'state': 'city',
              'region': 'city',
              'location': 'city',
              'address': 'city',
            };
            if (locationMappings[clause.key?.toLowerCase()]) {
              clause.key = locationMappings[clause.key.toLowerCase()];
            }
            clause.op = operator;
            clause.value = value;
            delete clause.field;
            delete clause.operator;
            delete clause.dateRange;
            delete clause.min;
            delete clause.max;
            delete clause.category;
            delete clause.purchased;
            break;
          case 'last_order_date':
            clause.op = operator || clause.op;
            clause.value = value || clause.value;
            delete clause.field;
            delete clause.operator;
            delete clause.key;
            delete clause.dateRange;
            delete clause.min;
            delete clause.max;
            delete clause.category;
            delete clause.purchased;
            break;
          case 'days_since_last_order':
            clause.op = operator || clause.op;
            clause.value = value || clause.value;
            delete clause.field;
            delete clause.operator;
            delete clause.key;
            delete clause.dateRange;
            delete clause.min;
            delete clause.max;
            delete clause.category;
            delete clause.purchased;
            break;
          case 'product_category':
            clause.category = clause.category || value || clause.field;
            clause.purchased = clause.purchased !== undefined ? clause.purchased : true;
            delete clause.field;
            delete clause.operator;
            delete clause.value;
            delete clause.key;
            delete clause.dateRange;
            delete clause.min;
            delete clause.max;
            break;
          case 'order_count':
          case 'total_spend':
            // Keep existing structure if already correct, otherwise transform
            if (!clause.min && !clause.max && operator) {
              // Try to convert operator to min/max
              if (operator === 'gt' || operator === 'gte') {
                clause.min = value;
              } else if (operator === 'lt' || operator === 'lte') {
                clause.max = value;
              } else if (operator === 'eq') {
                clause.min = value;
                clause.max = value;
              }
            }
            delete clause.field;
            delete clause.operator;
            delete clause.value;
            delete clause.key;
            delete clause.op;
            delete clause.category;
            delete clause.purchased;
            break;
        }
      }

      // Ensure required fields exist for each type
      switch (clause.type) {
        case 'attribute':
          // Map invalid operators to valid ones for attribute clauses
          const validAttributeOperators = ['eq', 'contains'];
          const attributeOperatorMappings = {
            'gt': 'eq',
            'gte': 'eq',
            'lt': 'eq',
            'lte': 'eq',
            'equals': 'eq',
            'equal': 'eq',
          };
          if (clause.op && !validAttributeOperators.includes(clause.op)) {
            clause.op = attributeOperatorMappings[clause.op.toLowerCase()] || 'eq';
          }
          if (!clause.op) clause.op = 'eq';
          if (!clause.key && clause.field) clause.key = clause.field;
          // Map common location field names to "city" (fallback)
          const locationMappings = {
            'state': 'city',
            'region': 'city',
            'location': 'city',
            'address': 'city',
          };
          if (locationMappings[clause.key?.toLowerCase()]) {
            clause.key = locationMappings[clause.key.toLowerCase()];
          }
          break;
        case 'last_order_date':
          if (!clause.op) clause.op = 'before';
          break;
        case 'days_since_last_order':
          if (!clause.op) clause.op = 'gt';
          break;
        case 'product_category':
          if (!clause.category) clause.category = clause.value || clause.field || 'unknown';
          if (clause.purchased === undefined) clause.purchased = true;
          break;
        case 'order_count':
        case 'total_spend':
          if (clause.min === undefined && clause.max === undefined) {
            clause.min = 0; // Default if no bounds specified
          }
          break;
      }

      return clause;
    });
  }

  return result;
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

IMPORTANT - Clause types (for segmentCriteria.clauses):
Each clause type has DIFFERENT field names and operators:

- "attribute": Use format { "type": "attribute", "key": "attributeName", "op": "eq" or "contains", "value": "value" }
  Example: { "type": "attribute", "key": "city", "op": "eq", "value": "New York" }
  Available attribute keys: "city", "loyaltyTier". Use "city" for location/state/region, NOT "state".

- "last_order_date": Use format { "type": "last_order_date", "op": "before" or "after", "value": "ISODateString" }
  Example: { "type": "last_order_date", "op": "before", "value": "2026-01-01T00:00:00Z" }
  IMPORTANT: Always use 2026 for dates. For "last month", use "2026-05-01" to "2026-06-01".

- "order_count": Use format { "type": "order_count", "dateRange": { "from": "ISODate", "to": "ISODate" }, "min": number, "max": number }
  Examples:
  - "more than 5 orders" → { "type": "order_count", "min": 5 }
  - "less than 10 orders" → { "type": "order_count", "max": 10 }
  - "between 5 and 10 orders" → { "type": "order_count", "min": 5, "max": 10 }
  - "at least 5 orders" → { "type": "order_count", "min": 5 }
  IMPORTANT: For date ranges, always use 2026 (e.g., "2026-05-01" to "2026-06-01").

- "total_spend": Use format { "type": "total_spend", "dateRange": { "from": "ISODate", "to": "ISODate" }, "min": number, "max": number }
  Examples:
  - "spent more than $500" → { "type": "total_spend", "min": 500 }
  - "spent less than $1000" → { "type": "total_spend", "max": 1000 }
  - "spent between $500 and $1000" → { "type": "total_spend", "min": 500, "max": 1000 }
  - "spent at least $500" → { "type": "total_spend", "min": 500 }
  IMPORTANT: For date ranges, always use 2026. For "last month" use "2026-05-01" to "2026-06-01".

- "product_category": Use format { "type": "product_category", "category": "categoryName", "purchased": true }
  Example: { "type": "product_category", "category": "electronics", "purchased": true }

- "days_since_last_order": Use format { "type": "days_since_last_order", "op": "gt" or "lt", "value": number }
  Example: { "type": "days_since_last_order", "op": "gt", "value": 30 }

DO NOT mix field names between clause types. Each type has its own specific format.
IMPORTANT: For location filtering, ALWAYS use key "city", never "state", "region", or "location".

IMPORTANT - Channel:
The channel MUST be exactly one of: "email", "sms", or "push". Do not use any other channel names like whatsapp, telegram, etc.
If the user mentions whatsapp or similar, map it to "sms".
If the user mentions email, use "email".
If the user mentions notifications or mobile app, use "push".

Always return valid JSON and nothing else.`;

  // Validate and filter history to ensure all messages have role and content
  const validHistory = Array.isArray(history) ? history.filter(h => h && h.role && h.content) : [];

  const messages = [
    { role: 'system', content: systemMessage },
    ...validHistory.map((h) => ({ role: h.role, content: h.content })),
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

  const result = JSON.parse(response.choices[0].message.content);

  // Validate and normalize channel
  const validChannels = ['email', 'sms', 'push'];
  const channelMappings = {
    'whatsapp': 'sms',
    'telegram': 'sms',
    'text': 'sms',
    'message': 'sms',
    'notification': 'push',
    'notifications': 'push',
    'mobile': 'push',
    'app': 'push',
    'mail': 'email',
  };

  if (result.channel) {
    const normalizedChannel = result.channel.toLowerCase().trim();
    // Check if it's a direct match
    if (validChannels.includes(normalizedChannel)) {
      result.channel = normalizedChannel;
    }
    // Check if it's in our mappings
    else if (channelMappings[normalizedChannel]) {
      result.channel = channelMappings[normalizedChannel];
    }
    // Default to email if still invalid
    else {
      result.channel = 'email';
    }
  }

  // Validate and normalize clause types and transform field names
  const validClauseTypes = ['attribute', 'last_order_date', 'order_count', 'total_spend', 'product_category', 'days_since_last_order'];
  const clauseTypeMappings = {
    'equals': 'attribute',
    'equal': 'attribute',
    'greater': 'order_count',
    'less': 'order_count',
    'date': 'last_order_date',
    'spending': 'total_spend',
    'category': 'product_category',
    'directfield': 'attribute',
    'ordercount': 'order_count',
    'totalspend': 'total_spend',
    'lastorderdate': 'last_order_date',
    'productcategory': 'product_category',
    'dayssincelastorder': 'days_since_last_order',
  };

  if (result.segmentCriteria && result.segmentCriteria.clauses) {
    result.segmentCriteria.clauses = result.segmentCriteria.clauses.map(clause => {
      if (!clause.type) return clause;

      const normalizedType = clause.type.toLowerCase().trim();
      // Check if it's a direct match
      if (validClauseTypes.includes(normalizedType)) {
        clause.type = normalizedType;
      }
      // Check if it's in our mappings
      else if (clauseTypeMappings[normalizedType]) {
        clause.type = clauseTypeMappings[normalizedType];
      }
      // Smart detection based on field/key name (even if type is already valid)
      else {
        clause.type = 'attribute'; // default
      }

      // Smart detection: override type if field/key suggests different type
      const fieldName = (clause.key || clause.field || '').toLowerCase();
      if (fieldName.includes('order') && fieldName.includes('count') && clause.type !== 'order_count') {
        clause.type = 'order_count';
      } else if (fieldName.includes('total') && fieldName.includes('spend') && clause.type !== 'total_spend') {
        clause.type = 'total_spend';
      } else if (fieldName.includes('product') && fieldName.includes('categor') && clause.type !== 'product_category') {
        clause.type = 'product_category';
      } else if (fieldName.includes('last') && fieldName.includes('order') && fieldName.includes('date') && clause.type !== 'last_order_date') {
        clause.type = 'last_order_date';
      } else if (fieldName.includes('day') && fieldName.includes('since') && fieldName.includes('last') && clause.type !== 'days_since_last_order') {
        clause.type = 'days_since_last_order';
      }

      // Transform field names based on clause type
      // Handle uniform format { field, operator, value } -> specific formats
      // Also handle cases where AI put right fields but wrong type
      if (clause.field || (clause.type !== 'attribute' && clause.key)) {
        const operator = clause.operator;
        const value = clause.value;

        switch (clause.type) {
          case 'attribute':
            clause.key = clause.field || clause.key;
            // Map common location field names to "city"
            const locationMappings = {
              'state': 'city',
              'region': 'city',
              'location': 'city',
              'address': 'city',
            };
            if (locationMappings[clause.key?.toLowerCase()]) {
              clause.key = locationMappings[clause.key.toLowerCase()];
            }
            clause.op = operator;
            clause.value = value;
            delete clause.field;
            delete clause.operator;
            delete clause.dateRange;
            delete clause.min;
            delete clause.max;
            delete clause.category;
            delete clause.purchased;
            break;
          case 'last_order_date':
            clause.op = operator || clause.op;
            clause.value = value || clause.value;
            delete clause.field;
            delete clause.operator;
            delete clause.key;
            delete clause.dateRange;
            delete clause.min;
            delete clause.max;
            delete clause.category;
            delete clause.purchased;
            break;
          case 'days_since_last_order':
            clause.op = operator || clause.op;
            clause.value = value || clause.value;
            delete clause.field;
            delete clause.operator;
            delete clause.key;
            delete clause.dateRange;
            delete clause.min;
            delete clause.max;
            delete clause.category;
            delete clause.purchased;
            break;
          case 'product_category':
            clause.category = clause.category || value || clause.field;
            clause.purchased = clause.purchased !== undefined ? clause.purchased : true;
            delete clause.field;
            delete clause.operator;
            delete clause.value;
            delete clause.key;
            delete clause.dateRange;
            delete clause.min;
            delete clause.max;
            break;
          case 'order_count':
          case 'total_spend':
            // Keep existing structure if already correct, otherwise transform
            if (!clause.min && !clause.max && operator) {
              // Try to convert operator to min/max
              if (operator === 'gt' || operator === 'gte') {
                clause.min = value;
              } else if (operator === 'lt' || operator === 'lte') {
                clause.max = value;
              } else if (operator === 'eq') {
                clause.min = value;
                clause.max = value;
              }
            }
            delete clause.field;
            delete clause.operator;
            delete clause.value;
            delete clause.key;
            delete clause.op;
            delete clause.category;
            delete clause.purchased;
            break;
        }
      }

      // Ensure required fields exist for each type
      switch (clause.type) {
        case 'attribute':
          // Map invalid operators to valid ones for attribute clauses
          const validAttributeOperators = ['eq', 'contains'];
          const attributeOperatorMappings = {
            'gt': 'eq',
            'gte': 'eq',
            'lt': 'eq',
            'lte': 'eq',
            'equals': 'eq',
            'equal': 'eq',
          };
          if (clause.op && !validAttributeOperators.includes(clause.op)) {
            clause.op = attributeOperatorMappings[clause.op.toLowerCase()] || 'eq';
          }
          if (!clause.op) clause.op = 'eq';
          if (!clause.key && clause.field) clause.key = clause.field;
          // Map common location field names to "city" (fallback)
          const locationMappings = {
            'state': 'city',
            'region': 'city',
            'location': 'city',
            'address': 'city',
          };
          if (locationMappings[clause.key?.toLowerCase()]) {
            clause.key = locationMappings[clause.key.toLowerCase()];
          }
          break;
        case 'last_order_date':
          if (!clause.op) clause.op = 'before';
          break;
        case 'days_since_last_order':
          if (!clause.op) clause.op = 'gt';
          break;
        case 'product_category':
          if (!clause.category) clause.category = clause.value || clause.field || 'unknown';
          if (clause.purchased === undefined) clause.purchased = true;
          break;
        case 'order_count':
        case 'total_spend':
          if (clause.min === undefined && clause.max === undefined) {
            clause.min = 0; // Default if no bounds specified
          }
          break;
      }

      return clause;
    });
  }

  return result;
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
