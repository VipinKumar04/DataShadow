# AI Setup and Configuration Guide

## Overview

DataShadow AI uses the official Google Gen AI SDK (`@google/genai`) to integrate with a hosted Google Gemma model (default: `gemma-4-26b-a4b-it`).

## Prerequisites

- Node.js 18+ (Node 20+ or Node 24 recommended)
- A valid Google AI Studio API key

## Environment Variables

All configuration is loaded from a root-level `.env` file (copied from `.env.example`):

| Variable | Description | Default / Example |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio API key | *(Required for live AI calls)* |
| `GEMINI_MODEL` | Gemma / Gemini model identifier | `gemma-4-26b-a4b-it` |
| `AI_REQUEST_TIMEOUT_MS` | AI model request timeout in ms | `60000` (60 seconds) |
| `AI_MAX_OUTPUT_TOKENS` | Maximum tokens in generated response | `4096` |
| `MAX_POLICY_TEXT_LENGTH`| Maximum policy text code units | `50000` |

> [!CAUTION]
> The `.env` file must never be committed to Git. The `.gitignore` file excludes `.env` and `.env.*`.

## Execution Commands

From the project root:

```bash
# Install dependencies
npm install

# Run the unified application server
npm start

# Run with file watch reload
npm run dev

# Run automated tests (runs on mocked AI responses, no live key required)
npm test
```

## Troubleshooting Common Errors

- **`503 AI_PROVIDER_UNAVAILABLE` (`MISSING_CONFIG`):** `GEMINI_API_KEY` or `GEMINI_MODEL` is not set in `.env`.
- **`504 AI_TIMEOUT` (`TIMEOUT`):** Upstream model response took longer than `AI_REQUEST_TIMEOUT_MS` (default 60s).
- **`502 AI_INVALID_RESPONSE` (`INVALID_MODEL_OUTPUT`):** Model generated text that could not be validated against the 7 canonical analysis fields or evidence quotes could not be verified.
- **`429 RATE_LIMITED`:** More than 10 requests submitted within 60 seconds from the same client IP.
