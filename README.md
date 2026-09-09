# AI Interview Prep Kit

An enterprise-grade, full-stack application and automated batch evaluation system that transforms raw job descriptions and company websites into comprehensive, highly personalized interview preparation kits.

---

## 1. Project Overview
The **AI Interview Prep Kit** bridges the gap between passive job descriptions and active interview readiness. Given a job description (JD), a target company website URL, and the number of days available before the interview, the system:
1. **Performs autonomous research** across the company website to extract organizational context, discover hidden hiring/interview handbooks, and synthesize public interview discussion.
2. **Extracts grounded competencies** from the job description with zero hallucination.
3. **Generates categorized interview questions and active recall flashcards** tied directly to specific requirements.
4. **Applies deterministic set coverage mathematics** to ensure 100% of must-have requirements are drilled.
5. **Closes coverage gaps** through an autonomous second-pass generation loop.
6. **Allocates a day-by-day study schedule** using arithmetic front-loading algorithms.
7. **Preserves user customizations, edits, and pins** across targeted section regenerations.
8. **Enables interactive active recall practice** with confidence tracking (1–5) and an automated **Weak Spots Report**.

Both the web application and the mandatory batch CLI (`npm run evaluate -- --input <cases.json> --output <kits.json>`) share the exact same underlying pipeline (`runInterviewPipeline`).

---

## 2. Problem Statement
Standard AI interview prep solutions suffer from several fatal flaws:
- **Single-prompt hallucination**: Cramming the JD, company URL, questions, and schedule into a single prompt results in shallow questions, invented technologies, and fabricated hiring processes.
- **Probabilistic failures in business logic**: Relying on an LLM to decide whether requirements are covered or to allocate day-by-day study hours results in missing must-have topics, floating-point durations, and non-deterministic schedules.
- **Destructive updates**: When a candidate regenerates a section, existing edits or custom questions are wiped out.
- **Passive reading**: Prep materials are formatted as static documents rather than interactive, confidence-weighted drill systems.

This project treats semantic extraction as an AI problem and business logic (IDs, coverage, scheduling, and validation) as deterministic software engineering problems.

---

## 3. Features
- **Multi-Role Builder & File Upload Support**: Prepare multiple roles simultaneously via interactive multi-role entry or file upload supporting structured JSON and RFC 4180 CSV formats with row-level validation, live preview, and isolated partial-failure handling.
- **Deterministic Multi-Pass Pipeline**: Verifies must-have coverage using set mathematics and automatically triggers second-pass question generation to close any gaps.
- **Autonomous Company Crawler**: Discovers hiring, culture, and about pages using link ranking heuristics rather than hardcoded URLs.
- **Robots & SSRF Defense**: Complies with `robots.txt`, enforces protocol allowlists, validates redirect destinations, blocks loopback/private/CGNAT IP ranges in production, and isolates untrusted web content from trusted instructions.
- **API Rate Limiting & Abuse Prevention**: Protects authentication, kit generation, and targeted regeneration endpoints using configurable sliding-window rate limiters.
- **State-Preserving Section Regeneration**: Preserves user-edited, user-pinned, and user-added questions when regenerating specific question categories or the company brief.
- **Deterministic Day-by-Day Scheduling**: Arithmetically distributes material across 1 to 60 days, ensuring all must-have topics are covered and harder topics are front-loaded.
- **Interactive Flashcard Practice Mode**: Active recall with 1–5 confidence ratings, prioritizing weaker cards in subsequent sessions.
- **Creative Feature — Weak Spots Report**: Aggregates practice data to detect critical competency risks and prescribes targeted question drills.
- **Mandatory Batch Evaluation CLI**: Supports `npm run evaluate -- --input <cases.json> --output <kits.json>` conforming strictly to Appendix A and B with atomic `.tmp` file writing.

---

## 4. Architecture
The repository follows a clean monorepo architecture separating retrieval, generation, scheduling, validation, persistence, and presentation:

```
                      +-----------------------------+
                      |       Next.js Web UI        |
                      |  (App Router, Tailwind CSS) |
                      +--------------+--------------+
                                     |
                                     | REST API (HTTP-only Session Cookies)
                                     v
                      +-----------------------------+         +--------------------------+
                      |      Express Backend        | <-----> |   npm run evaluate CLI   |
                      |   (Node.js + TypeScript)    |         | (Unified Batch Pipeline) |
                      +--------------+--------------+         +------------+-------------+
                                     |                                     |
                                     +------------------+------------------+
                                                        |
                                                        v
                                      +------------------------------------+
                                      |    Central Reusable Pipeline       |
                                      |     runInterviewPipeline(input)    |
                                      +-----------------+------------------+
                                                        |
         +--------------------+-------------------------+--------------------+--------------------+
         |                    |                         |                    |                    |
         v                    v                         v                    v                    v
  +--------------+    +----------------+       +------------------+   +--------------+    +---------------+
  |  Requirement |    | Company Crawler|       | LLM Synthesis    |   | Deterministic|   | Deterministic |
  |  Extractor   |    | (Link Ranker,  |       | (Brief, Role,    |   | Coverage     |   | Schedule      |
  |  (JD Only)   |    |  Cleaner, SSRF)|       |  Categorized Qs) |   | Engine       |   | Allocator     |
  +--------------+    +----------------+       +------------------+   +-------+------+   +---------------+
                                                                              |
                                                                              | Uncovered Must-Haves
                                                                              v
                                                                      +------------------+
                                                                      | Second-Pass Gap  |
                                                                      | Generation Loop  |
                                                                      +------------------+
```

---

## 5. Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express, TypeScript, Zod, Cheerio, Axios.
- **Database**: MongoDB & Mongoose.
- **Authentication**: JWT stored in secure HTTP-only cookies, password hashing with Bcrypt (12 rounds).
- **Testing**: Vitest, Supertest.
- **LLM Abstraction**: Pluggable provider adapter supporting Google Gemini (`gemini-2.0-flash`), Groq (`llama-3.3-70b`), OpenAI-compatible endpoints, and an offline Mock provider.

---

## 6. Why These Technologies?
- **Why Next.js App Router?** Server-rendered performance, responsive layouts, modular nested layouts (`/kits/[id]/layout.tsx`), and clear route boundaries.
- **Why Vanilla Tailwind CSS?** Maximum styling flexibility, clean design tokens, responsive breakpoints, and zero runtime CSS overhead.
- **Why Cheerio instead of Puppeteer/Playwright?** Extremely fast HTML parsing with low memory footprint, preventing token-per-minute or CPU exhaustion during crawling.
- **Why Zod for Schema Validation?** Runtime validation guarantees that untrusted LLM outputs strictly adhere to Appendix A without silent structural drift.
- **Why Vitest?** Instant execution, ESM compatibility, and built-in TypeScript support.

---

## 7. System Flow
1. **User Input / Case Input**: Job description text, company website URL, and integer days before interview.
2. **Requirement Extraction**: Grounded parsing of the JD to extract must/nice requirements and assign stable IDs (`r1, r2, ...`).
3. **Crawl & Clean**: Validates URL, respects `robots.txt`, extracts and ranks links, cleans HTML into text.
4. **Multi-Stage Research**:
   - Stage A: Company Overview & Products (`company_brief`).
   - Stage B: Hiring Process & Stages (`hiringResearch`).
   - Stage C: Public Interview Discussions (`publicDiscussion`).
5. **Synthesis**:
   - Role breakdown with seniority and responsibilities.
   - Categorized questions (Technical, Behavioural, System Design, Company Fit) linked to requirement IDs.
   - Active recall flashcards linked to requirement IDs.
6. **Deterministic Coverage Engine**: Computes uncovered must-have requirements using set mathematics.
7. **Second-Pass Loop**: If gaps exist, executes targeted question generation for missing requirements.
8. **Deterministic Schedule Allocation**: Arithmetically distributes questions across the exact number of requested days.
9. **Appendix A Validation**: Zod validates structural and referential integrity before persistence or CLI output.

---

## 8. Research Pipeline & Sequencing
Research is deliberately separated into distinct, isolated stages:
- The crawler fetches and ranks internal company pages before any question generation occurs.
- A hiring process page, once discovered (e.g. at `/handbook/hiring`), modifies question context: if a company mentions a take-home coding challenge or a system design review, the question generator adapts its prompts accordingly.
- If no hiring page is discovered, the pipeline reports this gap honestly rather than fabricating fictitious interview rounds.

---

## 9. Requirement Extraction
- **Function**: `extractRequirements(jd, llm)`
- **Rule**: Extract ONLY what is explicitly stated in the job description.
- **Classification**:
  - `kind`: `"technical" | "behavioural" | "domain"`
  - `priority`: `"must" | "nice"`
- **Contextual Language**: Distinguishes "required", "essential", "5+ years" as `must`, and "bonus", "plus", "preferred" as `nice`.
- **Thin JD Handling**: For a 2-line description, it produces a thin requirement set and records the lack of detail honestly without extrapolation.

---

## 10. Company Crawling & Link Ranking
### Why link ranking instead of hardcoded `/careers`?
Companies place hiring and engineering information in unpredictable locations (e.g. `/jobs`, `/handbook`, `/culture`, `/about/careers`, `/engineering-blog`). Hardcoding `/careers` results in frequent 404 errors.
Our crawler:
1. Normalizes relative URLs (e.g. `/acme/careers` from `http://localhost:8099/acme/`).
2. Ranks candidate links using keyword weights:
   - Hiring keywords (`careers`, `jobs`, `hiring`, `interview`): +50
   - Culture & handbook keywords (`handbook`, `engineering`, `culture`, `team`): +35
   - About & overview keywords (`about`, `company`, `mission`): +25
   - Tech blog keywords (`tech`, `blog`, `architecture`): +15
3. Penalizes or skips static assets (`.pdf`, `.png`, `.css`, `.js`) and login/cart pages.
4. Bounded page fetching (max 5 pages) to prevent token or resource exhaustion.

---

## 11. Hiring Page Discovery
Discovered hiring pages are parsed for interview stages, take-home tasks, and evaluation criteria.
- If found: Stages are documented and fed into question generation.
- If not found: Returns `{ found: false, processDescription: "No publicly discoverable hiring process information was found." }`.
- A missing hiring page is treated as partial research, not a fatal failure.

---

## 12. Public Interview Research
Analyzes public community discussions and developer forums regarding interview formats.
- If available: Summarizes general interview formats and common topics.
- If unavailable: Honestly records `"No useful public interview discussion was found."`

---

## 13. LLM Architecture & Pluggable Adapter
- Abstract `LLMService` interface implemented by `GeminiProvider`, `OpenAICompatibleProvider`, and `MockLLMProvider`.
- Automatic fallback: In test mode or when no API key is supplied, defaults to the deterministic `MockLLMProvider` so test suites and clean-clone evaluations never fail.
- Bounded retries: 3 attempts with exponential backoff (1s, 2s, 4s) for rate limits (429) or transient 5xx errors.
- Structured validation: If the model outputs malformed JSON, the adapter sends a corrective feedback prompt up to 3 times before failing gracefully.

---

## 14. Deterministic Coverage Algorithm
### Why deterministic coverage instead of asking the LLM?
Asking an LLM "Are all requirements covered?" is prone to hallucination, sycophancy, and non-reproducible answers. Set theory in TypeScript is 100% deterministic and provably correct:
```typescript
const mustIds = new Set(requirements.filter(r => r.priority === 'must').map(r => r.id));
const coveredIds = new Set(questions.flatMap(q => q.requirement_ids).filter(id => mustIds.has(id)));
const uncoveredIds = Array.from(mustIds).filter(id => !coveredIds.has(id));
```

---

## 15. Second-Pass Gap Resolution Algorithm
1. Pass 1 generates initial questions across all categories.
2. `checkCoverage` identifies `uncovered_requirement_ids`.
3. If uncovered must-haves exist and `passes < MAX_COVERAGE_PASSES` (3):
   - Targets ONLY the specific missing requirements with a focused generation prompt.
   - Appends the newly generated questions.
   - Re-runs `checkCoverage`.
   - Increments pass counter (`passes: 2` or `3`).
4. If gaps remain after maximum passes, they are recorded honestly in `coverage.uncovered_requirement_ids`.

---

## 16. Deterministic Schedule Allocation Algorithm
### Why deterministic scheduling instead of an LLM prompt?
Distributing material across days is an arithmetic and prioritization problem, not a generative one. An LLM frequently invents floating-point minutes, omits days, or puts the hardest topics on the final evening.
Our allocator:
1. Verifies `days_available === schedule.days.length === requested days`.
2. Assigns strictly 1-indexed days (`day: 1, 2, ..., days`).
3. Computes strictly integer durations in minutes (e.g. 45, 60, 80 mins).
4. Front-loads harder topics (`difficulty: 3 > 2 > 1`) and must-haves on earlier days so candidates master critical concepts well before interview day.
5. Ensures every must-have requirement appears in at least one scheduled question.
6. Gracefully handles 1-day schedules (consolidating all priorities) and 60-day schedules (distributing topics with structured revision cycles).

---

## 17. Generated, Edited, and Pinned State Preservation
Every question, flashcard, and section carries metadata:
```typescript
metadata: {
  source: "generated" | "user",
  isEdited: boolean,
  isPinned: boolean
}
```
### Regeneration Behavior:
- When the user clicks **"Regenerate Technical Questions"**:
  - Questions where `isEdited === true`, `isPinned === true`, or `source === 'user'` **MUST SURVIVE**.
  - Only untouched generated questions (`source === 'generated' && !isEdited && !isPinned`) are replaced.
  - Questions in other categories (`behavioural`, `system-design`, `company-fit`) are completely untouched.
- When regenerating the **Company Brief**:
  - Re-runs research and brief generation for the company.
  - Role, questions, flashcards, and schedule remain 100% untouched.
- When regenerating the **Schedule**:
  - Recomputes arithmetic day allocation without modifying any question or flashcard content.

---

## 18. Authentication & User Isolation
- Passwords hashed with `bcryptjs` using 12 salt rounds.
- Session tokens transmitted via HTTP-only, `SameSite=Lax`, `Secure` cookies.
- Sensitive authentication tokens are **never** stored in client `localStorage`.
- All Kit queries and mutations enforce `kit.userId.toString() === req.user._id.toString()`. User identity is always derived from the verified session, never trusted from client-supplied IDs.

---

## 19. Security Review & Untrusted Content Handling
- **Untrusted Content Boundary**: Scraped website content and pasted JD text are marked as `UNTRUSTED RETRIEVED CONTENT`. Prompt templates enforce a strict boundary preventing prompt injection.
- **SSRF Defense (`urlValidator.ts`)**:
  - Enforces `http:` and `https:` schemes only (rejects `file:`, `javascript:`, `ftp:`).
  - In production mode, resolves DNS hostnames and blocks private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`, `::1`).
  - In development and CLI evaluation mode, allows `localhost` addresses (e.g. `http://localhost:8099/acme/`) when `ALLOW_LOCAL_CRAWL=true`.
- **Resource Protection**: Timeouts capped at 8000ms, max response size capped at 1MB, max crawl depth capped at 5 pages.

---

## 20. Rate Limiting & Bounded Retries
- Bounded retries for external HTTP requests and LLM completions using exponential backoff (1s, 2s, 4s).
- Respects `Retry-After` headers if returned by the provider.
- Never retries indefinitely.

---

## 21. Error Handling & Structured API Responses
Uniform JSON response format across the entire API:
- **Success**:
  ```json
  { "success": true, "data": { ... } }
  ```
- **Failure**:
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_INPUT",
      "message": "Human readable explanation",
      "details": {}
    }
  }
  ```
- Stack traces are omitted in production responses.

---

## 22. Duplicate Submission Handling
- Computes deterministic input fingerprint: `SHA-256(normalized_url + ":::" + normalized_jd)`.
- If a completed kit with the identical fingerprint exists for the authenticated user, the existing kit is returned immediately, preventing redundant LLM expenditure unless explicit regeneration is triggered.

---

## 23. Practice Mode
Active recall interface for flashcards:
1. Presents question front.
2. User reveals answer.
3. User rates confidence from 1 ("Very Weak") to 5 ("Mastered").
4. Saves confidence history and last rating.
5. Next practice session prioritizes lowest confidence and unreviewed cards.

---

## 24. Creative Feature: Weak Spots Report & Targeted Revision
### Why this feature?
Candidates frequently practice questions randomly without knowing where they are most vulnerable. The **Weak Spots Report** aggregates practice ratings across requirements:
- Computes overall proficiency score (0–100%) and flashcard completion rate.
- Highlights requirements where average confidence is `<= 2.5/5`.
- Directly links weak requirements to recommended interview questions from the kit to drill before the interview.

---

## 25. Database Schema
### User Model:
- `_id`: ObjectId
- `email`: String (unique, indexed)
- `passwordHash`: String
- `createdAt`, `updatedAt`: Date

### Kit Model:
- `_id`: ObjectId
- `userId`: ObjectId (indexed)
- `status`: `"queued" | "running" | "completed" | "failed"` (indexed)
- `input`: `{ jd: String, company_url: String, days: Number }`
- `inputFingerprint`: String (indexed)
- `kit`: Exact Appendix A object
- `generationState`: Step-by-step progress tracker
- `practiceState`: Flashcard confidence history and session counters
- Compound Indexes: `{ userId: 1, createdAt: -1 }`, `{ userId: 1, inputFingerprint: 1 }`

---

## 26. API Documentation

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user | Public |
| `POST` | `/api/auth/login` | Sign in & set cookie | Public |
| `POST` | `/api/auth/logout` | Clear auth cookie | Protected |
| `GET` | `/api/auth/me` | Current user profile | Protected |
| `GET` | `/api/kits` | List user's kits | Protected |
| `POST` | `/api/kits` | Create kit & launch pipeline | Protected |
| `GET` | `/api/kits/:id` | Full kit detail | Protected |
| `DELETE`| `/api/kits/:id` | Delete kit | Protected |
| `GET` | `/api/kits/:id/generation-status` | Generation polling status | Protected |
| `PATCH` | `/api/kits/:id/company` | Inline edit company brief | Protected |
| `PATCH` | `/api/kits/:id/role` | Inline edit role | Protected |
| `POST` | `/api/kits/:id/questions` | Add custom question | Protected |
| `PATCH` | `/api/kits/:id/questions/:questionId` | Edit question or pin/unpin | Protected |
| `DELETE`| `/api/kits/:id/questions/:questionId` | Delete question | Protected |
| `PATCH` | `/api/kits/:id/questions/reorder` | Reorder questions | Protected |
| `PATCH` | `/api/kits/:id/questions/:questionId/category`| Move question category | Protected |
| `POST` | `/api/kits/:id/flashcards` | Add flashcard | Protected |
| `PATCH` | `/api/kits/:id/flashcards/:flashcardId`| Edit flashcard | Protected |
| `DELETE`| `/api/kits/:id/flashcards/:flashcardId`| Delete flashcard | Protected |
| `POST` | `/api/kits/:id/regenerate/company` | Regenerate company brief | Protected |
| `POST` | `/api/kits/:id/regenerate/questions/:category`| Regenerate category (preserves edits)| Protected |
| `POST` | `/api/kits/:id/regenerate/schedule` | Reallocate schedule | Protected |
| `POST` | `/api/practice/:id/confidence/:flashcardId` | Record practice rating (1–5) | Protected |
| `GET` | `/api/practice/:id/next` | Fetch prioritized practice queue | Protected |
| `GET` | `/api/practice/:id/weak-spots` | Fetch Weak Spots Report | Protected |

---

## 27. Environment Variables (`.env.example`)

```bash
# Server & Database
PORT=8000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ai-interview-prep-kit

# Security & Sessions
JWT_SECRET=super_secret_jwt_key_at_least_32_chars
COOKIE_SECRET=super_secret_cookie_signing_key
SESSION_MAX_AGE_DAYS=7
FRONTEND_URL=http://localhost:3000

# LLM Provider Configuration ("gemini" | "groq" | "openai" | "mock")
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.0-flash
LLM_API_KEY=your_gemini_api_key_here

# Crawler & Security Settings
ALLOW_LOCAL_CRAWL=true
MAX_CRAWL_PAGES=5
CRAWL_TIMEOUT_MS=8000
MAX_PAGE_BYTES=1048576
MAX_COVERAGE_PASSES=3
```

---

## 28. Local Setup Instructions

### 1. Prerequisites
- Node.js >= 18.0.0
- MongoDB running locally or a MongoDB Atlas connection URI

### 2. Clone and Install
```bash
git clone <repo-url>
cd ai-interview-prep-kit

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your LLM_API_KEY (or leave LLM_PROVIDER=mock for offline use)
```

---

## 29. Running Backend
```bash
# From repository root:
npm run dev:backend

# Or directly from backend:
cd backend && npm run dev
```
Backend runs on `http://localhost:8000`.

---

## 30. Running Frontend
```bash
# From repository root:
npm run dev:frontend

# Or directly from frontend:
cd frontend && npm run dev
```
Frontend runs on `http://localhost:3000`.

---

## 31. Test Instructions
To run the complete automated test suite (unit tests, crawler security tests, coverage tests, schedule tests, and pipeline integration tests):
```bash
npm test
```
To run type checking across both backend and frontend:
```bash
npm run typecheck
```

---

## 32. Batch CLI Instructions (Mandatory)
The repository exposes the required batch evaluation command:
```bash
npm run evaluate -- --input <cases.json> --output <kits.json>
```

### Example:
```bash
npm run evaluate -- --input ./cases/normal.json --output ./kits.json
```
- Reads array of cases with `id`, `jd`, `company_url`, and `days`.
- Executes the identical `runInterviewPipeline` used by the web application.
- Supports local test hosts and relative URLs.
- Writes atomically to `<output>`.
- One failed case does not abort the entire run; failed cases record structured errors while successful cases output the exact Appendix A structure.

---

## 33. Deployment
The application is designed for free-tier compatibility:
- **Frontend**: Deploy to Vercel or Netlify (`cd frontend && vercel`).
- **Backend**: Deploy to Render, Railway, or Fly.io (`cd backend && render deploy`).
- **Database**: MongoDB Atlas free M0 cluster.
- **LLM**: Google AI Studio Gemini API free tier or Groq free tier.

---

## 34. Known Limitations & Trade-offs
- **Free-Tier Rate Limits**: Free LLM tiers enforce token-per-minute limits. The application implements exponential backoff, but concurrent batch runs should respect bounded concurrency.
- **JavaScript-Heavy SPAs**: The Cheerio-based crawler parses static and server-rendered HTML. It does not execute client-side JavaScript, preventing memory bloat but limiting retrieval on dynamic SPAs that load all content asynchronously.
- **Localhost Crawling**: Enabled in development and evaluation mode via `ALLOW_LOCAL_CRAWL=true` to satisfy Section 9 local test servers, but disabled in production for SSRF protection.

---

## 35. Important Architectural "Why" Explanations
1. **Why link ranking instead of hardcoding `/careers`?** Companies organize hiring info under `/jobs`, `/handbook`, `/team`, `/join-us`. Ranking links based on weighted keywords discovers these pages autonomously.
2. **Why deterministic coverage checking?** Set intersection is exact and reliable. An LLM cannot be trusted to objectively audit its own omissions.
3. **Why deterministic scheduling?** Time allocation is arithmetic. It guarantees exact day counts, integer minutes, and front-loaded difficulty.
4. **Why separate question generation by category?** Technical questions require technical requirement evaluation; behavioral questions require STAR scenarios; system design requires architecture trade-offs. One generic prompt produces generic questions.
5. **Why preserve edited and pinned items?** A user's manual adjustments must not be clobbered when they request a regeneration of unedited items.
6. **Why HTTP-only cookies?** Storing authentication tokens in `localStorage` leaves sessions vulnerable to Cross-Site Scripting (XSS).
7. **Why status "ok" for partial research?** A company website without a hiring page is common on the open web. The system produces an honest kit noting the absence rather than failing the run.
8. **Why status "failed" only when a kit cannot be produced?** Reserve failure for cases where no kit can be delivered (e.g. unreachable domain or empty input).
9. **Why independent kits for multi-role submissions?** Combining multiple jobs into one object violates referential integrity. Each role/company pair produces an independent Kit document with isolated errors.

---

## 36. Trao Assessment Compliance Documents
- **[Assessment Gap Analysis](file:///./docs/assessment-gap-analysis.md)**: Full repository audit comparing every assessment requirement against implementation with gap resolutions.
- **[Assessment Compliance Matrix](file:///./docs/assessment-compliance.md)**: Detailed mapping of all 27 Trao requirements to code files, endpoints, UI routes, automated tests, and 100/100 scorecard.
- **[Demonstration Walkthrough Script](file:///./docs/demo-script.md)**: 3.5–4 minute scene-by-scene demonstration script for technical evaluators.

