# LogWeave 🧵

AI-powered distributed log analyzer using Gemini 3 Flash

## Problem
Engineers waste hours debugging distributed systems failures across interleaved logs from multiple microservices.

## Solution
LogWeave uses Gemini 3 to:
- Reconstruct chronological timelines across services
- Detect ambiguous event ordering and clock skew
- Identify root causes vs misleading symptoms
- Visualize request flows through distributed traces

## Gemini 3 Features Used
- **Advanced reasoning**: Multi-step causality analysis
- **Structured output**: JSON timeline with anomaly detection
- **Context awareness**: Uses expected behavior to identify deviations
- **Pattern detection**: Identifies timing impossibilities and misleading evidence

## Demo
🎥 [3-minute video](link)
🌐 [Live demo](vercel-link)

## Architecture
[Include diagram showing: User → Next.js → Log Parser → Gemini API → UI]

## Quick Start
```bash
npm install
echo "GEMINI_API_KEY=your_key" > .env.local
npm run dev
```

## Tech Stack
- Next.js 14, TypeScript, Tailwind CSS
- Gemini 3 Flash API
- Log parsing & trace correlation

## Impact
- ⏱️ Reduces debugging time from hours to minutes
- 💰 Prevents revenue loss from extended downtime
- 🎯 Directs engineers to actual root causes, not symptoms
```

---

## 5️⃣ Architecture Diagram

```
┌─────────────┐
│   Engineer  │
└──────┬──────┘
       │ Upload logs
       ▼
┌─────────────────────────────────┐
│      LogWeave (Next.js)         │
│  ┌──────────┐    ┌───────────┐ │
│  │   Log    │───▶│  Gemini   │ │
│  │  Parser  │    │ 3 Flash   │ │
│  └──────────┘    └───────────┘ │
│                         │        │
│  ┌──────────────────────▼─────┐│
│  │  Request Flow Visualizer   ││
│  │  Timeline View             ││
│  │  Root Cause Analysis       ││
│  └────────────────────────────┘│
└─────────────────────────────────┘

**LogWeave**: Because debugging distributed systems shouldn't take hours.
