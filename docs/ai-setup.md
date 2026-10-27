# AI Setup and Troubleshooting

## Requirements
- Node.js 18+
- Backend dependencies installed via `npm install` in `backend/`

## Environment variables (names only)
- NODE_ENV
- PORT
- GEMINI_API_KEY
- GEMINI_MODEL (default gemma-4-26b-a4b-it)
- AI_REQUEST_TIMEOUT_MS
- AI_MAX_OUTPUT_TOKENS
- MAX_POLICY_TEXT_LENGTH

## Run backend
cd backend
npm install
npm start

Health check: GET http://localhost:3000/api/health

## Analyze endpoint
POST /api/analyze
Body: { "policyText": "string", "language": "en" | "hi" }

## Tests
cd backend
npm test

Tests use mocked AI responses and do not call live APIs.

## Troubleshooting
- MISSING_CONFIG (503): set GEMINI_API_KEY and GEMINI_MODEL in .env.
- TIMEOUT (504): increase AI_REQUEST_TIMEOUT_MS.
- INVALID_MODEL_OUTPUT (422): model returned malformed JSON; retry.
- PROVIDER_ERROR (502): upstream AI provider failure.

## Limitations
Analysis is informational and not legal advice. Missing disclosures are reported as "Not mentioned in the supplied text" and do not prove an activity never occurs.
