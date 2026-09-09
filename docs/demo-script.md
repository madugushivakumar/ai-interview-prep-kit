# Trao Assessment Demonstration Script & Walkthrough Guide

**Application:** AI Interview Prep Kit  
**Target Duration:** 3.5 – 4 Minutes  
**Audience:** Trao Technical Evaluators & Reviewers  

---

## 0. Demo Prerequisites & Environment Setup

1. **Start Backend Server:**
   ```bash
   npm run dev:backend
   # Backend active on http://localhost:8000
   ```
2. **Start Frontend Server:**
   ```bash
   npm run dev:frontend
   # Frontend active on http://localhost:3000
   ```
3. **Ensure Database Connection:**
   Local MongoDB instance or MongoDB Atlas configured in `.env`.

---

## 1. Scene-by-Scene Walkthrough Script

### Scene 1: Landing Page & Architectural Overview (0:00 – 0:30)
- **Visual:** Open `http://localhost:3000`.
- **Narration:**
  > "Welcome to the AI Interview Prep Kit, an autonomous preparation engine designed for the Trao Full-Stack Engineering Assessment. The platform takes raw job descriptions and company websites, autonomously crawls and analyzes hiring handbooks and tech culture, extracts grounded requirements, and deterministically generates a day-by-day interview curriculum with active recall practice."
- **Actions:**
  - Highlight key metrics on landing page: Deterministic Coverage Engine, Zero-Hallucination Grounding, Exact Appendix A JSON schema enforcement.
  - Click **Get Started Free** to navigate to `/register` or `/login`.

---

### Scene 2: Authentication & User Dashboard (0:30 – 0:50)
- **Visual:** Login screen -> Dashboard (`/dashboard`).
- **Narration:**
  > "Authentication uses bcrypt password hashing and JWT sessions stored in secure HTTP-only cookies. Strict user isolation guarantees that kits, practice records, and revision metrics are private and protected against IDOR."
- **Actions:**
  - Log in with test user credentials.
  - View user dashboard showing previously generated kits and high-level progress.
  - Click **Create Interview Kit** button.

---

### Scene 3: Multi-Role Builder & File Upload Support (0:50 – 1:30)
- **Visual:** `/kits/new` page showing the 3 tab options: **Single Role**, **Multi-Role Builder**, and **File Upload (JSON/CSV)**.
- **Narration:**
  > "To satisfy Trao Critical Gap #1, the app supports three creation paradigms: single role entry, interactive multi-role entry, and structured file upload supporting both JSON and RFC 4180 CSV formats. Notice how the file upload provides instant server-side row validation, showing a live preview table with valid rows, error badges for malformed entries, and duplicate warnings."
- **Actions:**
  - Switch to **Multi-Role Builder** tab to show dynamic cards (`+ Add Role`, days presets).
  - Switch to **File Upload** tab, select `cases/multi-role.json` or sample CSV.
  - Highlight the interactive preview table showing parsed rows, days, JD snippet, and validation status badges.
  - Switch back to **Single Role** tab for the primary kit walkthrough: enter target company URL (`https://example.com`) and paste Senior Full-Stack Engineer JD. Select `5` days.
  - Click **Generate Interview Prep Kit**.

---

### Scene 4: Real-Time Generation Pipeline Progress (1:30 – 1:55)
- **Visual:** Live animated pipeline progress screen (`GenerationProgress.tsx`).
- **Narration:**
  > "Rather than displaying fake percentages, our generation screen reflects the actual stages of the unified `runInterviewPipeline`. The backend crawls the company website within bounded depth limits, parses robots.txt, synthesizes company research, extracts requirements, generates four categorized question banks, checks coverage deterministically using set arithmetic, runs second-pass gap resolution, and allocates a 5-day schedule."
- **Actions:**
  - Observe real-time progress transitions: Validating Input -> Extracting Requirements -> Crawling Company Site -> Synthesizing Company Overview -> Researching Hiring Process -> Public Discussions -> Role Analysis -> Questions -> Flashcards -> Coverage -> Gap Resolution -> Schedule -> Validating Kit Structure.
  - Automatic redirect to `/kits/:id` upon 100% completion.

---

### Scene 5: Company Research & Grounded Requirements (1:55 – 2:20)
- **Visual:** Kit Overview & Company Brief tab (`/kits/:id/company`).
- **Narration:**
  > "Here is our researched company brief. To prevent hallucination, all citations in `company_brief.sources` and `source.pages_used` map directly to URLs crawled from the target website. If research fails or information is missing, it honestly records that no public data was discovered without inventing facts."
- **Actions:**
  - Click **Edit Company Brief** to show inline builder modifications.
  - Navigate to **Role & Requirements** tab (`/kits/:id/role`).
  - Demonstrate requirement tags with stable sequential IDs (`r1, r2, ...`), kind (`technical`, `behavioural`, `domain`), and priority (`must` vs `nice`).

---

### Scene 6: Question Bank, Builder Mutations & State Preservation (2:20 – 2:55)
- **Visual:** Questions tab (`/kits/:id/questions`).
- **Narration:**
  > "Questions are partitioned into Technical, Behavioural, System Design, and Company-Fit. Notice how each question explicitly references one or more extracted requirement IDs. Now watch state preservation in action: I will edit question q1, pin question q2, and manually add a custom question q_user. When I trigger a targeted Technical category regeneration, only unpinned generated questions are refreshed. All user edits, pins, and custom items survive completely untouched."
- **Actions:**
  - Edit question prompt for `q1`.
  - Click Pin icon on `q2`.
  - Click **+ Add Custom Question**.
  - Click **Regenerate Category** (Technical).
  - Verify that `q1` retains edits, `q2` retains its pin, and `q_user` remains present.
  - Demonstrate question reordering via drag-and-drop and moving a question to another category.
  - Delete a question and show that coverage is recalculated deterministically.

---

### Scene 7: Deterministic Schedule & Active Recall Flashcard Practice (2:55 – 3:25)
- **Visual:** Schedule tab (`/kits/:id/schedule`) -> Flashcard Practice (`/kits/:id/practice`).
- **Narration:**
  > "The study schedule strictly matches the requested 5 days, with integer minute allocations front-loading must-have requirements and difficulty 3 questions. In Flashcard Practice mode, candidates drill key concepts using an active recall loop. Rating card confidence from 1 to 5 dynamically trains our prioritization algorithm: unpracticed and low-confidence cards are automatically queued first."
- **Actions:**
  - View Day 1 to Day 5 focus, questions, and duration.
  - Navigate to **Flashcards** -> **Start Practice Session**.
  - Flip a card to reveal the back.
  - Rate confidence: `1` (Struggling) and `5` (Mastered).
  - Show the queue instantly re-prioritizing cards based on ratings.

---

### Scene 8: Creative Feature: Weak Spots Report & Gap Analysis (3:25 – 3:45)
- **Visual:** Weak Spots tab (`/kits/:id/weak-spots`).
- **Narration:**
  > "Our standout creative feature is the Weak Spots Report. Instead of generic analytics, it aggregates raw practice confidence history and maps it back to specific extracted requirement IDs and question banks. Candidates immediately see which technical and behavioral areas need urgent revision before their interview."
- **Actions:**
  - Review Proficiency Score gauge, Completion Rate, and Critical Weak Areas.
  - Expand a weak spot to show the recommended interview questions directly targeted to shore up that gap.

---

### Scene 9: Batch Evaluation CLI & Exact Output Contract (3:45 – 4:00)
- **Visual:** Terminal window running the evaluation CLI.
- **Narration:**
  > "Finally, Section 9 of the Trao specification requires an exact batch evaluation CLI command. Running `npm run evaluate -- --input ./cases/normal.json --output ./kits.json` executes the exact same underlying pipeline, writes atomically via temporary files, and produces 100% compliant Appendix B output with zero structural deviations."
- **Actions:**
  - Execute:
    ```bash
    npm run evaluate -- --input ./cases/normal.json --output ./kits.json
    ```
  - Open `kits.json` to confirm `"version": "1.0"`, status `"ok"`, exact Appendix A kit structure, integer minutes, and valid sequential IDs.

---

## 2. Fast Reference Command Sheet

| Action | Command | Expected Result |
|---|---|---|
| **Run Unit & Integration Tests** | `npm test` | 57 passed tests across 12 test files |
| **Run TypeScript Typecheck** | `npm run typecheck` | 0 errors on backend and frontend |
| **Compile Production Build** | `npm run build` | Next.js and backend `dist/` compiled |
| **Batch CLI Normal Evaluation** | `npm run evaluate -- --input ./cases/normal.json --output ./kits.json` | Exit 0, Appendix B JSON |
| **Batch CLI Multi-Role Evaluation** | `npm run evaluate -- --input ./cases/multi-role.json --output ./kits-multi.json` | Exit 0, 3 kits generated |
| **Batch CLI Thin JD Edge Case** | `npm run evaluate -- --input ./cases/thin-jd.json --output ./kits-thin.json` | Exit 0, thin JD handled |
| **Batch CLI Unreachable Company** | `npm run evaluate -- --input ./cases/unreachable-company.json --output ./kits-unreachable.json` | Exit 0, status "failed" with code |
