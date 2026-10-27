# DataShadow AI

> **Understand Privacy Policies. Make Informed Decisions.**

DataShadow AI is an informational tool that analyzes privacy-policy text and provides plain-language summaries and structured disclosures. Powered by a hosted Google Gemma model through the `@google/genai` SDK, it breaks down data collection, third-party sharing, data retention practices, potential user privacy concerns, practical recommendations, and relevant caveats.

---

## 🎯 MVP Scope & Core Features

- **Single Application Server:** One unified Node.js and Express application serving both the accessible EJS frontend and the JSON REST API.
- **Privacy Policy Analysis (`POST /api/analyze`):**
  - **7 Canonical Analysis Fields:**
    1. `summary`: Concise plain-language policy overview.
    2. `dataCollected`: Categories, stated purposes, and supporting evidence quotes.
    3. `sharing`: Third-party recipients, stated purposes, and evidence quotes.
    4. `retention`: Disclosed retention periods, deletion rules, and evidence quotes.
    5. `concerns`: Potential privacy concerns categorized by severity (`low`, `medium`, `high`) with explanations and evidence quotes.
    6. `recommendations`: Actionable, practical steps for users to review or take.
    7. `limitations`: Explicit caveats, notes on missing disclosures, and legal disclaimers.
- **Sub-string Evidence Verification:** Every finding must cite verbatim, unnormalized excerpts from the user's submitted policy text. Findings with unverified or missing excerpts are filtered out.
- **Bilingual Analysis Support:** Full analysis in English (`en`) and Hindi (`hi`), while preserving English JSON keys and machine enums.
- **Resilient Security & Rate Limiting:**
  - In-memory rate limiting: 10 requests per client IP per minute with `Retry-After` header.
  - 400 KB JSON request body limit and 50,000 character policy length limit.
  - Defense against prompt injection: user text is treated strictly as untrusted data.
  - Zero credential leakage: API keys and submitted policy texts are never logged or exposed to the browser.
- **Health Check (`GET /api/health`):** Instant verification that the backend server is running.

---

## 📁 Repository Structure

```text
DataShadow/
├── backend/
│   ├── app.js                   # Express application setup, view engine, routes & error middleware
│   ├── server.js                # Server entry point (app.listen on process.env.PORT || 3000)
│   ├── controllers/
│   │   └── analyzeController.js # POST /api/analyze controller & error status mapping
│   ├── middleware/
│   │   ├── errorHandler.js      # Centralized error handler (INVALID_JSON, REQUEST_TOO_LARGE, etc.)
│   │   ├── rateLimit.js         # IP-based rate limiter (10 req/min with Retry-After)
│   │   └── validateAnalyzeRequest.js # Request payload validation (415, 400, 413, 422)
│   ├── routes/
│   │   ├── analyzeRoutes.js     # Router for POST /api/analyze
│   │   └── healthRoutes.js      # Router for GET /api/health
│   ├── services/
│   │   └── aiAnalysisService.js # AI service wrapping @google/genai, prompts, timeout & parsing
│   └── utils/
│       └── validateAnalysis.js  # Schema validator, evidence substring checker & filter
├── frontend/
│   ├── public/
│   │   ├── css/style.css        # Responsive, accessible stylesheet
│   │   └── js/app.js            # Client-side script (DOM APIs, error handling, state management)
│   └── views/
│       └── index.ejs            # Main EJS template rendered at GET /
├── tests/
│   ├── aiAnalysisService.test.js    # Unit tests for AI service & error mappings
│   ├── analyzeIntegration.test.js   # End-to-end API integration tests
│   ├── analyzeValidation.test.js    # Input validation and error scenario tests
│   ├── frontendIntegration.test.js # Template rendering & static asset tests
│   ├── health.test.js               # Health check endpoint tests
│   ├── rateLimit.test.js            # Rate limiter tests & Retry-After header
│   └── validateAnalysis.test.js     # Schema and evidence substring validation tests
├── docs/
│   ├── DataShadow-API-Contract.md   # Authoritative team API contract v1
│   └── ai-setup.md                  # AI service setup, configuration & troubleshooting guide
├── package.json                 # Root project manifest, dependencies & scripts
├── package-lock.json            # Deterministic dependency tree lockfile
├── .env.example                 # Placeholder environment configuration template
├── .gitignore                   # Ignore rules (excludes .env, node_modules, etc.)
└── README.md                    # Project documentation
```

---

## 📋 Prerequisites

- **Node.js:** v18.0.0 or later (v20+ or v24 recommended)
- **npm:** v9.0.0 or later
- **Google AI Studio API Key:** For accessing the hosted Gemma model (optional for running tests; tests run on mocked responses)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/VipinKumar04/DataShadow.git
cd DataShadow
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a local `.env` file in the repository root by copying `.env.example`:
```bash
cp .env.example .env
```
Edit `.env` with your real credentials:
```dotenv
NODE_ENV=development
PORT=3000
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemma-4-26b-a4b-it
AI_REQUEST_TIMEOUT_MS=60000
AI_MAX_OUTPUT_TOKENS=4096
MAX_POLICY_TEXT_LENGTH=50000
```
> [!IMPORTANT]
> The `.env` file is for your local environment only and is ignored by Git. **Never commit `.env` or share your API key.**

### 4. Run the server
- **Production / Standard mode:**
  ```bash
  npm start
  ```
- **Development mode (with Node `--watch` reload):**
  ```bash
  npm run dev
  ```
Once started, visit **http://localhost:3000** in your web browser.

---

## 🧪 Running Automated Tests

All tests execute using Node.js's native test runner (`node:test` and `node:assert`). No external test frameworks or live API keys are required:

```bash
npm test
```

The automated test suite runs 53 tests across 8 suites covering:
- EJS template rendering and static asset serving
- GET `/api/health` response validation
- Input validation (missing fields, wrong types, empty text, invalid JSON, unsupported media type)
- Boundary limits (50,000 char threshold, 400 KB payload limit)
- Rate limiting and `Retry-After` header verification
- AI service prompts, error mapping, timeout simulation, and evidence substring verification

---

## 🌐 API Reference

### Health Check
```http
GET /api/health
```
**Response (`200 OK`):**
```json
{
  "success": true,
  "status": "ok"
}
```

### Analyze Privacy Policy
```http
POST /api/analyze
Content-Type: application/json
```
**Request Body:**
```json
{
  "policyText": "We collect your email address to provide customer support. We retain support logs for 30 days.",
  "language": "en"
}
```

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "analysis": {
    "summary": "The policy explains that email addresses are collected for support and retained for 30 days.",
    "dataCollected": [
      {
        "category": "Contact Information",
        "purpose": "Provide customer support",
        "evidence": "We collect your email address to provide customer support."
      }
    ],
    "sharing": [],
    "retention": [
      {
        "topic": "Support logs",
        "details": "Retained for 30 days",
        "evidence": "We retain support messages for 30 days."
      }
    ],
    "concerns": [],
    "recommendations": [
      "Verify retention policies if you request account deletion."
    ],
    "limitations": [
      "Analysis is informational and limited to the supplied excerpt."
    ]
  }
}
```

**Standard Error Response Schema:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Please provide valid privacy-policy text and a supported language."
  }
}
```

| HTTP Status | Error Code | Description |
|---|---|---|
| `400` | `INVALID_JSON` | Malformed JSON request body |
| `400` | `INVALID_INPUT` | Missing or invalid fields, non-string, or unknown keys |
| `413` | `POLICY_TOO_LONG` | `policyText` exceeds 50,000 code units |
| `413` | `REQUEST_TOO_LARGE` | JSON body exceeds 400 KB |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Content-Type is not `application/json` |
| `422` | `UNSUPPORTED_LANGUAGE` | `language` is not `en` or `hi` |
| `429` | `RATE_LIMITED` | Exceeded 10 requests per minute per IP |
| `502` | `AI_INVALID_RESPONSE` | Model output could not be validated |
| `503` | `AI_PROVIDER_UNAVAILABLE` | AI provider unavailable or missing configuration |
| `504` | `AI_TIMEOUT` | AI request exceeded timeout (default 60s) |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected server error |

---

## 👥 Team Collaboration & Workflow

DataShadow AI is built collaboratively across three roles coordinated through Git feature branches:

- **Person 1 (Frontend & UI):** Designed accessible EJS view templates, modern CSS tokens, client-side validation, and safe DOM rendering.
- **Person 2 (Backend & API Integration):** Architected Express application, routes, controllers, validation middleware, rate limiting, and unified server integration.
- **Person 3 (AI Integration, QA & Contract Compliance):** Authored Google Gen AI service layer, model prompts, schema validation, and test suites.

**Branch Workflow:**
- `feature/person-1-frontend`: Person 1 frontend development branch
- `feature/person-2-backend-api`: Person 2 backend & integration branch
- `feature/person-3-ai-qa-docs`: Person 3 AI service & QA branch
- `main`: Production-ready release branch

---

## 🔒 Privacy, Security & Limitations

- **Informational Tool:** DataShadow AI provides informational summaries and is **not** a substitute for legal advice.
- **Grounded Evidence:** All findings must cite exact, verbatim excerpts from the provided text.
- **Missing Disclosures:** Absence of a disclosure in submitted text does not prove an organization never performs that practice.
- **Untrusted Input Handling:** User-provided policy text is treated as untrusted data in model prompts to prevent prompt injection.
- **No Data Persistence:** Policy texts and analysis results are never stored in a database or logged on the server.

---

## 🔧 Troubleshooting

| Issue | Likely Cause | Solution |
|---|---|---|
| `AI_PROVIDER_UNAVAILABLE` / `MISSING_CONFIG` | `GEMINI_API_KEY` or `GEMINI_MODEL` is missing in `.env` | Ensure `.env` exists in the project root and has a valid API key and model name. |
| `AI_TIMEOUT` (`504`) | AI provider took longer than timeout | Check internet connection or increase `AI_REQUEST_TIMEOUT_MS` in `.env`. |
| `AI_INVALID_RESPONSE` (`502`) | Model output failed JSON parsing or schema checks | Retry request; prompt instructions and code fence strippers handle standard markdown output automatically. |
| `RATE_LIMITED` (`429`) | More than 10 requests submitted within 60 seconds | Check the `Retry-After` header value and wait the specified seconds before retrying. |

---

## 📄 License

ISC License. See package configuration for details.