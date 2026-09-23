# ProofLearn

ProofLearn turns a student submission into a short, adaptive text-based academic defence.

**We don't detect AI. We verify learning.**

The product checks whether a student can explain the ideas behind a written answer. It builds a concept map from the assignment and submission, asks targeted questions, adapts the next question to each response, and produces a concise mastery report.

## Product Flow

1. A teacher enters the subject, assignment, and student submission.
2. Stage A extracts key concepts, student claims, expected reasoning, and possible misconceptions.
3. The interview starts with a question derived from the concept map.
4. Stage B evaluates every answer and chooses the next question and difficulty.
5. After four rounds, the final stage creates a concept-level mastery report.

## Features

- Four focused screens: landing, setup, verification, and report
- Structured concept extraction before the interview begins
- Adaptive questions based on the complete question and answer history
- Concept scores based on a transparent four-level rubric
- Evidence quotes, explanations, misconception status, and a recommended next step
- Session recovery after a page refresh
- Warm editorial interface designed for desktop and mobile
- Next.js API routes that run alongside the frontend

## Tech Stack

- Next.js with the App Router
- React and TypeScript
- CSS with a small custom design system
- OpenAI-compatible chat completions API
- Vercel-ready serverless API routes

## Getting Started

### Requirements

- Node.js 20 or newer
- npm
- An API key for an OpenAI-compatible LLM provider

### Install

```bash
npm install
```

### Configure the environment

Create a local `.env.local` file in the project root:

```env
LLM_API_KEY=your_api_key
LLM_MODEL=gpt-4o-mini
```

For an OpenAI-compatible provider with a different endpoint, add:

```env
LLM_BASE_URL=https://provider.example.com/v1/chat/completions
```

Never commit `.env.local`. It is excluded by `.gitignore`.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Create a production build

```bash
npm run build
npm start
```

## API Routes

| Route | Purpose |
| --- | --- |
| `POST /api/structure` | Runs Stage A and returns a concept map plus the first question |
| `POST /api/evaluate` | Runs Stage B and returns answer quality, mastery updates, and the next question |
| `POST /api/report` | Aggregates the interview into the final mastery report |

The LLM integration is isolated in `lib/llm.ts` so the provider can be changed in one place.

## Deployment

The frontend and backend can be deployed together on Vercel. No separate backend service is required for this MVP.

1. Import the GitHub repository into Vercel.
2. Add `LLM_API_KEY` under Project Settings and Environment Variables.
3. Add `LLM_MODEL` with the model supported by your provider.
4. Add `LLM_BASE_URL` only when using a non-default OpenAI-compatible endpoint.
5. Deploy.

## Collaboration

Create a feature branch before making changes:

```bash
git checkout -b feature/short-description
```

After testing locally:

```bash
git add .
git commit -m "Describe the change"
git push -u origin feature/short-description
```

Open a pull request into `main` so changes can be reviewed before merging.

## Scope

ProofLearn is intentionally a focused MVP. It does not include accounts, student profiles, class rosters, LMS integrations, history, plagiarism detection, or class analytics.

## License

This project is currently intended for hackathon and demonstration use.
