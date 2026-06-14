# 🧠 AI-Native Mini CRM
### Built for Xeno Engineering Take-Home Assignment

A production-grade, AI-native Mini CRM that helps retail and D2C brands intelligently reach their shoppers. Marketers describe their intent in plain English — the AI handles segmentation, message drafting, campaign dispatch, and performance tracking.

**Live Demo:** [ai-native-mini-crm.vercel.app](https://ai-native-mini-crm.vercel.app)  
**Backend API:** [ai-native-mini-crm-gs5n.onrender.com](https://ai-native-mini-crm-gs5n.onrender.com)

---

## 🎯 What It Does

Instead of manually filtering spreadsheets and copy-pasting messages, a marketer can type:

> *"Find shoppers from California who spent over $500 last month on electronics and send them an SMS offering 20% discount"*

And the AI will:
- ✅ Parse the intent into a MongoDB aggregation query
- ✅ Find all matching shoppers (e.g. 8 shoppers)
- ✅ Draft a personalized message for each
- ✅ Dispatch the campaign via the channel simulator
- ✅ Track delivery, opens, clicks in real time

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Next.js Frontend (Vercel)        │
│  Dashboard │ Segments │ Campaigns │ AI   │
└─────────────────┬───────────────────────┘
                  │ REST API + SSE
┌─────────────────▼───────────────────────┐
│      Node.js / Express Backend (Render)  │
│                                          │
│  ┌─────────────┐  ┌───────────────────┐ │
│  │ AI Intent   │  │ Campaign          │ │
│  │ Engine      │  │ Orchestrator      │ │
│  │ (Groq/LLM)  │  │ (p-queue)         │ │
│  └─────────────┘  └───────────────────┘ │
│                                          │
│  ┌─────────────┐  ┌───────────────────┐ │
│  │ Segmentation│  │ Channel Simulator  │ │
│  │ Engine      │  │ (async callbacks)  │ │
│  │ (MongoDB    │  │ delivered/opened/  │ │
│  │ aggregation)│  │ clicked            │ │
│  └─────────────┘  └───────────────────┘ │
│                                          │
│  ┌─────────────┐  ┌───────────────────┐ │
│  │ Attribution │  │ SSE Stream        │ │
│  │ Engine      │  │ (real-time stats) │ │
│  └─────────────┘  └───────────────────┘ │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           MongoDB Atlas                  │
│  Shoppers │ Orders │ Campaigns │ Messages│
└─────────────────────────────────────────┘
```

---

## ✨ Key Features

### 🤖 AI-Native Segmentation
Natural language → MongoDB aggregation pipeline. Type what you want, the AI builds the query.

```
Input:  "Find high value customers inactive for 30 days"
Output: MongoDB $lookup + $match pipeline targeting the right shoppers
```

### 🎯 AI Campaign Copilot
Describe a campaign goal in plain English. The AI segments, drafts, and launches end-to-end.

### 📡 Channel Simulator
Two-service callback architecture mimicking real providers (Twilio, SendGrid):
- CRM dispatches message → Channel Simulator receives
- Simulator asynchronously fires: `delivered → opened → clicked`
- CRM ingests callbacks → updates stats in real time

### 📊 Real-Time Analytics
- Live delivery tracking via Server-Sent Events (SSE)
- AI-generated performance summaries
- Side-by-side campaign comparison
- Revenue attribution engine (7-day window)

### 🗄️ Batch Data Ingestion
Enterprise-grade ingestion pipeline with p-queue for shoppers and orders.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, Tailwind CSS, React |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| AI | Groq (LLaMA 3.1 8B) via OpenAI-compatible API |
| Queue | p-queue for campaign dispatch |
| Auth | JWT |
| Deployment | Vercel (frontend) + Render (backend) |
| Dev Tools | GitHub Copilot, Claude |

---

## 📁 Project Structure

```
AI-Native-Mini-CRM/
├── xeno-crm-client/          # Next.js frontend
│   └── src/
│       ├── app/
│       │   ├── (auth)/       # Login, Register
│       │   └── (dashboard)/  # Dashboard, Shoppers, Segments, Campaigns, AI
│       └── lib/
│           ├── api.js         # API fetch wrapper
│           └── auth.js        # JWT token management
│
└── xeno-crm-server/          # Express backend
    └── src/
        ├── models/            # MongoDB schemas
        │   ├── Shopper.js
        │   ├── Order.js
        │   ├── Campaign.js
        │   ├── Message.js
        │   ├── Segment.js
        │   └── CampaignStats.js
        ├── routes/            # API endpoints
        │   ├── auth.js
        │   ├── shoppers.js
        │   ├── segments.js
        │   ├── campaigns.js
        │   └── ai.js
        └── services/          # Core business logic
            ├── aiAgent.js         # AI intent engine
            ├── segmentation.js    # MongoDB aggregation builder
            ├── campaignOrchestrator.js  # Campaign dispatch + channel simulator
            ├── ingestion.js       # Batch data ingestion
            └── seedData.js        # Demo data seeder
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Groq API key (free at console.groq.com)

### Backend Setup
```bash
cd xeno-crm-server
npm install

# Create .env file
cp .env.example .env
# Fill in your values

npm start
# Server runs on http://localhost:3001
```

### Frontend Setup
```bash
cd xeno-crm-client
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

npm run dev
# App runs on http://localhost:3000
```

### Seed Demo Data
```bash
# First register an account on the app, then:
cd xeno-crm-server
node seedDb.js
# Seeds 200 shoppers + 800+ orders for all registered marketers
```

---

## 🌱 Environment Variables

### Backend (`xeno-crm-server/.env`)
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_here
OPENAI_API_KEY=your_groq_key
OPENAI_MODEL=llama-3.1-8b-instant
OPENAI_BASE_URL=https://api.groq.com/openai/v1
ATTRIBUTION_WINDOW_DAYS=7
CHANNEL_SERVICE_TOKEN=your_token
```

### Frontend (`xeno-crm-client/.env.local`)
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## 🎮 Demo Prompts

### Segment Builder
```
Find shoppers from California who spent more than $500 last month on electronics
```
```
Find all gold loyalty tier customers inactive for 30 days
```
```
Show me high value customers who spent over $2000 total
```

### AI Campaign Copilot
```
Send an SMS to my Cali Electronics Whales offering 20% discount
```
```
Launch a win-back campaign for inactive gold tier customers with a special offer
```
```
Find VIP platinum customers and send them an exclusive early access email
```

---

## ⚖️ Tradeoffs & Decisions

### Channel Service — Embedded vs Separate
**Decision:** Embedded the channel simulator as an internal async function rather than a separate microservice.

**Reasoning:** For this assignment scope, embedding gave faster iteration speed while preserving the same async callback pattern. In production, this would be extracted as a standalone service with proper webhook endpoints, retry logic, and dead letter queues.

### AI Model — Groq/LLaMA vs OpenAI
**Decision:** Used Groq's LLaMA 3.1 8B via OpenAI-compatible API.

**Reasoning:** Groq offers significantly faster inference (tokens/sec) which improves the real-time feel of the AI copilot. The OpenAI-compatible interface means switching to GPT-4 in production requires changing one config value.

### Queue — p-queue vs Bull/BullMQ
**Decision:** Used p-queue (in-memory) instead of Redis-backed Bull.

**Reasoning:** p-queue is sufficient for demo scale. At production scale with thousands of campaigns, Bull with Redis would provide persistence, retries, and distributed processing.

### Segmentation — Real-time vs Pre-computed
**Decision:** Segments are evaluated live at campaign launch, not pre-computed.

**Reasoning:** Ensures audience accuracy at send time. Pre-computation would be added at scale with scheduled refresh jobs.

---

## 🤖 AI-Native Development Workflow

This project was built AI-natively:

- **GitHub Copilot** — Used as a debugging partner throughout. When hitting MongoDB aggregation errors or segmentation pipeline issues, Copilot helped surface root causes faster than reading docs alone.
- **Claude** — Used to architect the AI intent engine system prompt, iterating on the FilterCriteria schema until the LLM reliably generated valid MongoDB-compatible queries.

Key insight: AI tools are force multipliers, not replacements. Every architectural decision was made deliberately — the async callback pattern, p-queue for dispatch, SSE for real-time updates — AI helped execute faster within those decisions.

---

## 📬 Submission

Built by **Kartikeya Kaushal** for Xeno FDE Role — June 2026

- GitHub: [github.com/Kartikeya-09](https://github.com/Kartikeya-09)
- Email: kaushalkartikeya733@gmail.com
- LinkedIn: [linkedin.com/in/kartikeyakaushal](https://linkedin.com/in/kartikeyakaushal)
