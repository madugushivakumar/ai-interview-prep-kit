# Trao Assessment Gap Analysis & Audit Report

**Date:** 2026-09-10  
**Project:** AI Interview Prep Kit  
**Assessment Standard:** Trao Full-Stack Engineering Assessment Specification  
**Audit Scope:** Full repository audit (Frontend, Backend, Database Models, Pipeline, Crawler, Research, LLM Providers, CLI, Security, Rate Limiting, Multi-Role, Tests)

---

## 1. Executive Summary

This audit evaluates the codebase against all mandatory requirements in the Trao Full-Stack Engineering Assessment specification. While the core deterministic business logic (Appendix A schema validation, deterministic set-based coverage checking, deterministic schedule allocation, state preservation, and batch evaluation CLI) is well architected and verified, several critical functional, architectural, and security gaps were discovered:

1. **Critical Gap #1 (Multi-Role & File Upload):** Missing backend multi-role/batch endpoint and missing frontend UI for entering multiple roles or uploading structured JSON/CSV files.
2. **Critical Gap #2 (Research Data Flow):** Public discussion research was performed in the pipeline but not wired into question generation; company-fit questions required tighter grounding in research findings; crawler lacked redirect-validation against SSRF.
3. **Critical Gap #3 (Rate Limiting & Deletion Consistency):** Missing API rate limiting on authentication and expensive generation endpoints; question deletion did not recalculate must-have requirement coverage; flashcard deletion did not clean up practice state.
4. **Duplicate Generation Protection Race Conditions:** Two identical concurrent POST requests could bypass the completed-kit check and launch duplicate pipelines simultaneously.

---

## 2. Comprehensive Requirement Audit Matrix

| Requirement | Existing Implementation | Status | Gap | Required Fix | Verification |
|---|---|---|---|---|---|
| **1. Appendix A Kit Contract** | Exact Zod schema in `schemas/kit.schema.ts`, referential integrity validator | **COMPLETE** | None. Enforces exact fields, integer minutes, valid requirement_ids and question_ids. | Maintain schema validation in pipeline. | Unit tests in `validation.test.ts` pass. |
| **2. Multi-Role Preparation** | Single role entry only in frontend `NewKitPage` and backend `createKit` | **MISSING** | No UI to add another JD/company pair; no batch endpoint; no JSON/CSV multi-role file upload; no row-level validation. | Implement `multiRoleParser.ts`, batch endpoints (`/api/kits/batch`), frontend multi-role form & file upload, live table preview, partial failure handling. | `multiRole.test.ts` and browser verification. |
| **3. Independent Role Kits** | Single Kit model | **PARTIAL** | Multi-role submissions must create separate, independently tracked MongoDB documents with isolated errors. | In batch generation, create independent Kit records with stable IDs; partial failure of one role does not corrupt others. | Integration test with 1 failing role among 2 valid roles. |
| **4. Dynamic Web Crawler** | `CompanyCrawler`, `linkRanker`, `htmlCleaner` | **COMPLETE** | Discovers internal links from root, dedupes, normalizes, and bounds crawl. | None. Ensure redirect SSRF is blocked. | `crawler.test.ts` passes with 8 tests. |
| **5. Robots.txt Compliance** | `RobotsParser.fetch()` parses Disallow/Allow rules | **COMPLETE** | Evaluates rules before queuing links; falls back gracefully when absent. | Verify edge cases (wildcards, missing robots.txt, malformed lines). | Unit test in `crawler.test.ts`. |
| **6. SSRF Security** | `urlValidator.ts` blocks private IPv4 and localhost in production | **PARTIAL** | Redirects in Axios were unvalidated; link-local IPv6, shared CGNAT ranges (`100.64.0.0/10`) not fully enumerated. | Add redirect verification interceptor in crawler; expand IPv6 link-local and CGNAT checks. Localhost allowed only in evaluation mode. | `crawler.test.ts` & `security.test.ts`. |
| **7. Research Influence on Generation** | Stages A, B, C implemented in `services/research/` | **PARTIAL** | Stage C (public discussion) was awaited but its output was not passed to `generateCategorizedQuestions`. | Pass `publicDiscussionResearch` to question generator; ground `company-fit` questions directly in research. | Pipeline integration tests & inspection. |
| **8. Honest Research Fallbacks** | Research services return `found: false` on missing data | **PARTIAL** | Fallback in `companyOverview.ts` claimed "Software and technology solutions provider" on failure. | Return neutral honest message ("Information could not be extracted") rather than fabricated business type. | Research unit tests. |
| **9. Prompt Injection Defense** | `promptSanitizer.ts` wraps data in `UNTRUSTED RETRIEVED CONTENT` | **COMPLETE** | System instructions explicitly prohibit executing untrusted content directives. | Add comprehensive injection test cases (prompt injection in JD, website HTML, public discussions). | `security.test.ts`. |
| **10. Deterministic Coverage Engine** | `coverageChecker.ts` using strict set difference | **COMPLETE** | Evaluates must-have requirements only. Pure set arithmetic, no LLM guesswork. | Maintain existing implementation. | `coverage.test.ts` passes 5 tests. |
| **11. Multi-Pass Gap Resolution** | `interviewPipeline.ts` second-pass loop up to `MAX_COVERAGE_PASSES` | **COMPLETE** | Re-checks coverage after each pass; records passes honestly; never fakes success. | Maintain existing implementation. | Integration test in `pipeline.test.ts`. |
| **12. Deterministic Schedule Allocation** | `scheduleAllocator.ts` | **COMPLETE** | Allocates exact 1..N days (1-60), integer minutes, front-loads difficulty 3 & must-have requirements. | Maintain existing implementation. | `schedule.test.ts` passes 7 tests. |
| **13. State Preservation** | `StatePreserver.ts` preserves pins, edits, and user additions | **COMPLETE** | Preserves user items during targeted category, company, and schedule regenerations. | Maintain existing implementation. | `statePreserver.test.ts` passes. |
| **14. Builder Mutations & Consistency** | Inline updates in `kit.controller.ts` | **PARTIAL** | Deleting question did not recalculate coverage; deleting flashcard did not clean practice state. | In `deleteQuestion`, recalculate coverage; in `deleteFlashcard`, filter out card from `practiceState.cards`. | Add mutation tests in `mutation.test.ts`. |
| **15. Long-Running Async Generation** | Mongo status (`queued`, `running`, `completed`, `failed`) and polling route | **COMPLETE** | Frontend polls `/api/kits/:id/generation-status`; survives browser reload. | Ensure batch status polling is supported for multi-role workflows. | Test reload during generation. |
| **16. Duplicate Generation Protection** | SHA-256 fingerprinting | **PARTIAL** | Concurrent in-flight requests with identical input could trigger duplicate pipelines. | Check for existing `running` kit or in-memory lock; support `forceNew: true` for intentional copies. | Add duplicate concurrency test. |
| **17. Rate Limiting** | None | **MISSING** | No rate limiting middleware on Express app. | Implement in-memory token-bucket / sliding window rate limiting for auth, generation, and general routes. | Add rate limiting tests in `rateLimit.test.ts`. |
| **18. Authentication & User Isolation (IDOR)** | JWT in HTTP-only cookies, bcrypt hashing, kit ownership check | **COMPLETE** | All kit routes check `kitDoc.userId === req.user._id`. | Verify cross-user unauthorized access rejection. | Integration tests in `auth.test.ts` and `idor.test.ts`. |
| **19. Flashcard Practice & Confidence** | `PracticeService` records 1-5 rating, tracks history | **COMPLETE** | Prioritizes unpracticed (rating 0) and low-confidence (1, 2) cards. | Maintain existing implementation. | `practice.test.ts`. |
| **20. Weak Spots Report** | Computes proficiency, weak requirements, recommendations | **COMPLETE** | Maps low confidence ratings back to requirement IDs and question IDs. Honest empty state. | Maintain existing implementation. | Tested via practice tests. |
| **21. Batch Evaluation CLI** | `scripts/evaluate.ts` executes exact command | **COMPLETE** | Accepts `--input` & `--output`, outputs Appendix B JSON, atomic write via `.tmp` file, tolerates failures. | None. Working as specified. | Batch runs on all 8 test cases. |
| **22. Edge Cases** | 8 case files in `cases/` | **COMPLETE** | Handles 1-day, 60-day, thin JD, unreachable company, no hiring page, duplicate. | Add multi-role case file (`cases/multi-role.json`). | Evaluate against all cases. |

---

## 3. Action Plan for Full Compliance

1. **Implement Multi-Role Parser & Batch Generation (`backend/src/services/batch/multiRoleParser.ts`)**:
   - Parse JSON and CSV formats with row-level validation.
   - Enforce 5MB upload limit, detect duplicate records, validate company URLs and day ranges.
   - Support partial failure: independent execution of each role.
2. **Expose Batch Endpoints (`backend/src/controllers/kit.controller.ts`)**:
   - `POST /api/kits/batch` (structured list of roles).
   - `POST /api/kits/batch/upload` (file upload handler).
3. **Connect Research Data Flow**:
   - Pass `publicDiscussionResearch` to question generation.
   - Enhance prompt instructions for company-fit and system-design questions to leverage company research context.
   - Clean fallbacks in `companyOverview.ts` to avoid generic claims.
4. **Harden Crawler & SSRF**:
   - Add redirect-destination IP validation in `CompanyCrawler`.
   - Expand IPv6 link-local and CGNAT ranges in `urlValidator.ts`.
5. **Data Integrity on Deletions**:
   - Recalculate coverage upon question deletion.
   - Clean practice cards upon flashcard deletion.
6. **Implement API Rate Limiting**:
   - In-memory rate limiter middleware for Auth (`/api/auth/*`), Kit Generation (`/api/kits` POST), and Targeted Regeneration.
7. **Frontend Multi-Role UI**:
   - Add Single / Multi-Role / File Upload tabs on `/kits/new`.
   - Table preview for uploaded JSON/CSV with validation badges.
   - Batch progress tracker showing independent role progress bars and kit links.
8. **Add Comprehensive Tests**:
   - Multi-role parser tests (valid JSON, valid CSV, malformed JSON, malformed CSV, missing fields, duplicates, oversized).
   - Integration test for multi-role partial failure.
   - Prompt injection defense tests.
   - Deletion consistency tests.
   - SSRF and redirect validation tests.
   - Rate limiting tests.
9. **Final Audit & Verification**:
   - Run unit/integration tests (`npm test`), typecheck (`npm run typecheck`), build (`npm run build`), and evaluation CLI (`npm run evaluate`).
