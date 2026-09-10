import { LLMService } from './llm.interface.js';
import { heuristicExtractRole } from '../generation/roleGenerator.js';
import { heuristicExtract } from '../generation/requirementExtractor.js';

/**
 * Deterministic Mock LLM Provider
 * Enables completely offline testing and automated integration testing without external API dependency.
 */
export class MockLLMProvider implements LLMService {
  public async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    if (systemPrompt.includes('summary') || userPrompt.includes('summary')) {
      return 'Acme is an innovative technology company building next-generation distributed systems.';
    }
    return 'Detailed mock analysis output.';
  }

  public async generateJson<T>(
    systemPrompt: string,
    userPrompt: string,
    _schemaDescription: string,
    _validateFn?: (parsed: any) => { isValid: boolean; error?: string }
  ): Promise<T> {
    const sysLower = systemPrompt.toLowerCase();
    const userLower = userPrompt.toLowerCase();

    // 1. Flashcards (check before generic 'question' match)
    if (sysLower.includes('flashcard') || userLower.includes('flashcard')) {
      return this.mockFlashcards(systemPrompt, userPrompt) as unknown as T;
    }

    // 2. Requirement Extraction
    if (sysLower.includes('extract requirements') || sysLower.includes('requirement parser') || sysLower.includes('job description parser')) {
      return this.mockRequirements(userPrompt) as unknown as T;
    }

    // 3. Hiring Process
    if (sysLower.includes('hiring') && (sysLower.includes('interview process') || sysLower.includes('recruiter analyzing') || sysLower.includes('careers'))) {
      return {
        found: true,
        processDescription: 'Standard 4-stage engineering evaluation covering screening, system design, coding, and behavioral alignment.',
        stages: [
          'Recruiter Introduction (30 min)',
          'Technical Architecture & System Design (60 min)',
          'Live Coding & Problem Decomposition (60 min)',
          'Engineering Leadership & Culture Fit (45 min)'
        ],
        sources: ['https://example.com/careers']
      } as unknown as T;
    }

    // 4. Public Interview Discussion
    if (sysLower.includes('developer discourse') || sysLower.includes('public interview') || sysLower.includes('interview experiences') || sysLower.includes('publicly reported')) {
      return {
        found: true,
        discussionSummary: 'Candidates have publicly reported a rigorous and collaborative interview loop emphasizing system reliability, concurrency, and architecture trade-offs.',
        commonTopics: [
          'High concurrency & race condition handling',
          'Distributed system trade-offs (CAP theorem, caching, partitioning)',
          'Incident retrospective and behavioral conflict resolution'
        ],
        sources: ['https://example.com/community/interview-experience']
      } as unknown as T;
    }

    // 5. Company Brief
    if (sysLower.includes('analyst') || sysLower.includes('company overview') || sysLower.includes('what_they_do')) {
      return {
        summary: 'Cloud-native software and infrastructure organization delivering distributed telemetry platforms.',
        what_they_do: 'Develops enterprise-grade distributed observability, logging, and performance management platforms.',
        industry: 'Enterprise Cloud Software',
        primary_domains: ['Cloud Infrastructure', 'Observability', 'Developer Tooling'],
        engineering_domains: ['Distributed Systems', 'High-Throughput Ingestion', 'Site Reliability'],
        business_model: 'Enterprise B2B SaaS & Cloud Subscriptions',
        company_scale: 'Global enterprise scale serving tens of thousands of organizations',
        products_services: [
          {
            name: 'Cloud Observability Platform',
            description: 'Unified telemetry ingestion and APM dashboards for distributed microservices.',
            source: 'https://example.com/products'
          },
          {
            name: 'Distributed Tracing Engine',
            description: 'Low-overhead distributed trace collection and bottleneck identification system.',
            source: 'https://example.com/products'
          }
        ],
        mission: 'Empower engineering teams to operate resilient, transparent distributed systems worldwide.',
        values: [
          {
            value: 'Customer-Obsessed Reliability',
            description: 'Uptime and performance under extreme load are paramount to our customers.',
            source: 'https://example.com/about'
          },
          {
            value: 'Engineering Rigor',
            description: 'Design decisions must be grounded in empirical benchmarks and transparent trade-offs.',
            source: 'https://example.com/about'
          }
        ],
        engineering_context: {
          themes: ['High-Throughput Event Streams', 'Zero-Downtime Deployments', 'Distributed Consensus'],
          challenges: ['Multi-region active-active failover', 'Sub-millisecond trace indexing', 'Data pipeline backpressure'],
          tech_areas: ['Distributed Storage', 'Cloud Platforms', 'Observability Pipelines'],
          blog_urls: ['https://example.com/blog']
        },
        engineering_challenges: [
          {
            challenge: 'High-Volume Ingestion Backpressure',
            details: 'Safely buffering millions of events per second during network partitions without data loss.',
            source: 'https://example.com/engineering'
          },
          {
            challenge: 'Cross-Region Latency & Consistency',
            details: 'Balancing read latency with strong write guarantees across globally replicated clusters.',
            source: 'https://example.com/engineering'
          }
        ],
        sources: ['https://example.com/about']
      } as unknown as T;
    }

    // 6. Role Breakdown
    if (sysLower.includes('recruiter') || sysLower.includes('role profile') || (sysLower.includes('seniority') && sysLower.includes('responsibilities'))) {
      return this.mockRole(userPrompt) as unknown as T;
    }

    // 7. Question Generation & Gap Closure
    if (sysLower.includes('interviewer') || sysLower.includes('question') || sysLower.includes('coverage gap')) {
      return this.mockQuestions(systemPrompt, userPrompt) as unknown as T;
    }

    // Generic fallback object
    return [] as unknown as T;
  }

  private mockRole(userPrompt: string): any {
    let jd = userPrompt;
    const jdMatch = userPrompt.match(/<<< DATA SECTION: JOB_DESCRIPTION >>>\s*([\s\S]*?)(?=\n<<<|$)/i);
    if (jdMatch && jdMatch[1]) {
      jd = jdMatch[1].trim();
    }
    let companyName = 'Company';
    const compMatch = userPrompt.match(/<<< DATA SECTION: COMPANY_NAME >>>\s*([^\n]+)/i);
    if (compMatch && compMatch[1]) {
      companyName = compMatch[1].trim();
    }

    return heuristicExtractRole(jd, companyName);
  }

  private mockRequirements(userPrompt: string): any[] {
    let jd = userPrompt;
    const jdMatch = userPrompt.match(/<<< DATA SECTION: JOB_DESCRIPTION >>>\s*([\s\S]*?)(?=\n<<<|$)/i);
    if (jdMatch && jdMatch[1]) {
      jd = jdMatch[1].trim();
    }

    const reqs = heuristicExtract(jd);
    return reqs.map((r, idx) => ({
      id: `r${idx + 1}`,
      text: r.text,
      kind: r.kind,
      priority: r.priority
    }));
  }

  private mockQuestions(systemPrompt: string, userPrompt: string): any[] {
    // Accurately detect requested category from explicit section or instruction
    let detectedCategory = 'technical';

    const categoryDataMatch = userPrompt.match(/<<< DATA SECTION: CATEGORY >>>\s*([a-z-]+)/i);
    if (categoryDataMatch && categoryDataMatch[1]) {
      detectedCategory = categoryDataMatch[1].toLowerCase().trim();
    } else {
      const sysCatMatch = systemPrompt.match(/specialized\s+(technical|behavioural|system-design|company-fit)/i);
      if (sysCatMatch && sysCatMatch[1]) {
        detectedCategory = sysCatMatch[1].toLowerCase().trim();
      }
    }

    // Extract exclusions if provided
    const exclusions: string[] = [];
    const avoidMatch = (systemPrompt + ' ' + userPrompt).match(/EXISTING QUESTIONS TO AVOID:[\s\S]*?(?=\n\n|\n[A-Z_]+:|$)/i);
    if (avoidMatch) {
      const lines = avoidMatch[0].split('\n').slice(1);
      lines.forEach(l => {
        const cleaned = l.replace(/^[-*\d.\s]+/, '').trim().toLowerCase();
        if (cleaned) exclusions.push(cleaned);
      });
    }

    const reqMatches = Array.from((systemPrompt + ' ' + userPrompt).matchAll(/\[(r\d+)\]/g)).map(m => m[1]);
    const targetReqIds = Array.from(new Set(reqMatches));

    const isExcluded = (prompt: string) => {
      const pNorm = prompt.toLowerCase().trim();
      return exclusions.some(e => pNorm.includes(e) || e.includes(pNorm));
    };

    const formatQuestions = (bank: any[], count: number) => {
      const available = bank.filter(q => !isExcluded(q.prompt));
      const selected = (available.length >= count ? available : bank).slice(0, count);
      if (targetReqIds.length > 0) {
        return selected.map((q, idx) => ({
          ...q,
          requirement_ids: [targetReqIds[idx % targetReqIds.length]]
        }));
      }
      return selected;
    };

    if (detectedCategory === 'behavioural') {
      const behaviouralBank = [
        {
          requirement_ids: ['r6', 'r1'],
          category: 'behavioural',
          prompt: 'Describe a time when you guided a junior engineer through an architectural bottleneck. How did you balance coaching with delivery?',
          answer_outline: 'Situation: Junior engineer stuck on complex query caching. Task: Deliver sprint on time while enabling skill growth. Action: Paired on design patterns and set incremental milestones. Result: Feature delivered on schedule; junior engineer independently led next refactor. Reflection: Empowering engineers through Socratic review accelerates team velocity.',
          difficulty: 2
        },
        {
          requirement_ids: ['r6', 'r2'],
          category: 'behavioural',
          prompt: 'Tell me about a situation where you had a strong technical disagreement with a peer or tech lead over architectural design. How did you resolve it?',
          answer_outline: 'Situation: Disagreed on synchronous REST versus asynchronous event-driven queues for microservice coordination. Task: Reach technical consensus without delaying roadmap. Action: Benchmarked throughput, documented trade-off matrix with latency vs consistency, and presented empirical data. Result: Team aligned on event streaming; eliminated cascade timeouts. Reflection: Grounding disagreements in metrics prevents subjective friction.',
          difficulty: 3
        },
        {
          requirement_ids: ['r6'],
          category: 'behavioural',
          prompt: 'Can you describe a production incident or outage that occurred under your watch? Walk through how you prioritized mitigation and communication.',
          answer_outline: 'Situation: Sudden connection pool exhaustion caused 500 errors on the payment endpoint. Task: Restore service immediately and maintain stakeholder trust. Action: Declared Sev-1, rolled back suspect release, initiated read replica failover, and updated incident channel every 15 minutes. Result: MTTR under 18 minutes with zero transaction loss; authored comprehensive post-mortem with automated connection leak tests.',
          difficulty: 3
        },
        {
          requirement_ids: ['r6', 'r1'],
          category: 'behavioural',
          prompt: 'Give an example of when you had to deliver a critical project under tight deadlines with high ambiguity and incomplete requirements.',
          answer_outline: 'Situation: Launching third-party API integration with incomplete vendor documentation 3 weeks before black Friday. Task: Ship resilient MVP without compromising core invariants. Action: Defined contract boundaries with strict schema validation, built mocks, and maintained direct feedback loop with product managers. Result: Shipped on time with zero release defects. Reflection: Incremental delivery de-risks ambiguous scope.',
          difficulty: 2
        },
        {
          requirement_ids: ['r6'],
          category: 'behavioural',
          prompt: 'Describe a time you advocated for addressing critical technical debt when stakeholders pushed for immediate feature delivery.',
          answer_outline: 'Situation: Legacy monolithic schema caused database CPU spikes during peak hours. Task: Secure product buy-in for refactoring amidst feature pressure. Action: Framed tech debt in business terms: translated query slowdowns into dropped conversions and calculated engineering time lost to hotfixes. Result: Dedicated 20% of sprint capacity to indexing and schema optimization; cut latency by 65%.',
          difficulty: 2
        },
        {
          requirement_ids: ['r6', 'r2'],
          category: 'behavioural',
          prompt: 'Tell me about a time you identified a flaw in a proposed team architecture or process before it reached production.',
          answer_outline: 'Situation: Design review proposed distributed locks across services using Redis without TTL leases. Task: Prevent potential deadlocks during node restarts. Action: Raised edge case during RFC review, simulated network partition failure modes, and demonstrated lock recovery alternative using idempotent state transitions. Result: Adopted lease-based locking; prevented unrecoverable worker deadlocks.',
          difficulty: 3
        },
        {
          requirement_ids: ['r6'],
          category: 'behavioural',
          prompt: 'How do you handle receiving critical constructive feedback on your code architecture or leadership style from a colleague?',
          answer_outline: 'Situation: Tech lead critiqued my PR for over-engineering an abstraction layer. Task: Absorb feedback constructively and refine the implementation. Action: Scheduled a quick sync to understand simplicity requirements, removed unnecessary indirection, and adopted team standard. Result: Code merged with higher readability and team alignment.',
          difficulty: 1
        },
        {
          requirement_ids: ['r6', 'r1'],
          category: 'behavioural',
          prompt: 'Describe a scenario where you took total end-to-end ownership of an initiative outside your direct responsibilities to ensure team success.',
          answer_outline: 'Situation: CI/CD test runner instability was causing 40% false-positive build failures across the engineering org. Task: Eliminate flaky tests impacting developer velocity. Action: Profiled test runner timeouts, isolated non-deterministic async tests, and introduced containerized test fixtures. Result: CI pass rate rose from 60% to 99.4%, saving 12 hours of collective build waiting per week.',
          difficulty: 2
        },
        // Extra questions for rotation during regeneration
        {
          requirement_ids: ['r6'],
          category: 'behavioural',
          prompt: 'Tell me about a time you mentored an engineer who was struggling to meet expectations. How did you approach the situation?',
          answer_outline: 'Situation: Junior developer struggled with asynchronous programming and missed sprint goals. Task: Elevate engineer to autonomous contribution. Action: Conducted weekly 1-on-1 code walkthroughs, broke down tasks into manageable PRs, and provided targeted practice resources. Result: Engineer completed next 3 sprints independently and was promoted within 9 months.',
          difficulty: 2
        },
        {
          requirement_ids: ['r6'],
          category: 'behavioural',
          prompt: 'Can you describe a time when business priorities changed abruptly mid-sprint? How did you manage team focus and technical momentum?',
          answer_outline: 'Situation: Enterprise client requirement shifted roadmap 5 days before release. Task: Pivot deliverable without leaving orphaned branches or demoralizing the team. Action: Documented half-finished state behind feature flags, held alignment standup, and re-scoped deliverable cleanly. Result: Successfully delivered new priority without accumulating unmergeable branches.',
          difficulty: 2
        }
      ];

      return formatQuestions(behaviouralBank, 8);
    }

    if (detectedCategory === 'system-design') {
      const systemDesignBank = [
        {
          requirement_ids: ['r3', 'r2'],
          category: 'system-design',
          prompt: 'Design a distributed telemetry and log ingestion pipeline capable of processing 500,000 events per second with sub-second query availability.',
          answer_outline: 'Requirements: High write throughput, fault tolerance, at-least-once ingestion. Scale: 500k eps, 1KB avg size = 500MB/s bandwidth. Architecture: Edge API gateways -> Kafka message bus partition key by customerId -> Stream processing workers (Flink/Go) -> Hot tier in Elasticsearch/ClickHouse, cold tier in S3. Storage: Partitioned columnar storage, TTL retention policies. Reliability: Backpressure handling, dead-letter queues, and cross-AZ replication.',
          difficulty: 3
        },
        {
          requirement_ids: ['r1', 'r2'],
          category: 'system-design',
          prompt: 'Design a real-time collaborative document editing engine supporting concurrent text edits, presence indicators, and offline sync.',
          answer_outline: 'Requirements: Conflict-free real-time text sync, cursor presence, offline editing. Architecture: WebSockets with sticky sessions via Redis pub/sub; Operational Transformation (OT) or CRDT (e.g. Yjs/Automerge) for state convergence. Data Model: Append-only operation log with periodic vector-clock snapshots. Scaling: Horizontal WebSocket gateway cluster with Redis cluster pub/sub routing.',
          difficulty: 3
        },
        {
          requirement_ids: ['r2', 'r3'],
          category: 'system-design',
          prompt: 'Design a high-throughput, multi-tenant distributed rate limiter and API quota management system protecting downstream microservices.',
          answer_outline: 'Requirements: Sub-millisecond latency, sliding window counter algorithm, tenancy isolation. Architecture: Distributed Redis cluster using Lua scripts for atomic sliding-window increment and evaluation. Resilience: Local in-memory token bucket fallback (resilience on Redis partition), asynchronous quota synchronizers. Observability: Rate limit headers (X-RateLimit-Remaining) and Prometheus counter metrics.',
          difficulty: 3
        },
        {
          requirement_ids: ['r2'],
          category: 'system-design',
          prompt: 'Design an event-driven notification dispatch service capable of delivering millions of push, email, and SMS alerts with priority tiers and deduplication.',
          answer_outline: 'Requirements: Multi-channel delivery, user notification preference management, deduplication within time window. Architecture: Priority queues (High/Medium/Low) in SQS/RabbitMQ; Idempotency layer using Redis SETNX with event deduplication hashes. Worker Pool: Rate-limited workers honoring vendor API limits (Twilio/SendGrid/APNs). Reliability: Exponential backoff retries and DLQ alerting.',
          difficulty: 2
        },
        {
          requirement_ids: ['r3', 'r1'],
          category: 'system-design',
          prompt: 'Design a global URL shortening and analytics redirect service with low latency and 99.999% read availability.',
          answer_outline: 'Requirements: Short URL generation, sub-10ms redirect latency, real-time analytics. Scale: 100:1 read-to-write ratio, 10B links. ID Generation: Base62 encoding on 64-bit distributed counter (Snowflake ID) to eliminate collision checks. Caching: Multi-region Redis caching with LRU eviction for top 20% URLs (80/20 rule). Analytics: Async event emitting via Kafka to analytics aggregation pipeline.',
          difficulty: 2
        },
        {
          requirement_ids: ['r2', 'r3'],
          category: 'system-design',
          prompt: 'Design an e-commerce order processing and inventory reservation system ensuring strict consistency without distributed deadlocks.',
          answer_outline: 'Requirements: Zero inventory overselling, high checkout concurrency, payment idempotency. Architecture: Two-phase reservation pattern or Saga orchestration engine. Data Model: Optimistic locking with version counters in PostgreSQL/MongoDB on inventory SKU documents. Resilience: Outbox pattern for message publishing; compensatory transactions if payment fails.',
          difficulty: 3
        },
        {
          requirement_ids: ['r3', 'r2'],
          category: 'system-design',
          prompt: 'Design a scalable multi-region file upload and virus scanning pipeline for assets up to 5GB in size.',
          answer_outline: 'Requirements: Resumable chunked uploads, asynchronous virus scanning, fast CDN delivery. Architecture: Client requests pre-signed multipart S3 URLs from API gateway; client uploads directly to object store. Event Trigger: S3 ObjectCreated webhook triggers serverless scanner worker. Security: Quarantine bucket until scan completes, then atomic promote to public CDN origin.',
          difficulty: 2
        },
        {
          requirement_ids: ['r3'],
          category: 'system-design',
          prompt: 'Design a distributed cache invalidation architecture ensuring data consistency between primary databases and distributed read caches.',
          answer_outline: 'Requirements: High read throughput, cache-aside pattern, minimizing stale reads across replicas. Architecture: Change Data Capture (CDC via Debezium) streaming database binlogs to Kafka; invalidator workers purge or update Redis entries. Edge Cases: Thundering herd mitigation via distributed mutex (single-flight) and probabilistic early expiration (XFetch).',
          difficulty: 3
        },
        // Extra questions for rotation during regeneration
        {
          requirement_ids: ['r3', 'r2'],
          category: 'system-design',
          prompt: 'Design a distributed search indexing system that supports real-time text search across billions of product listings.',
          answer_outline: 'Requirements: Sub-second indexing of updates, inverted index partitioning, typo tolerance. Architecture: CDC pipe from primary DB -> Kafka -> Indexing coordinator -> Sharded Elasticsearch cluster with primary/replica shards. Query routing: Load-balanced gateway with distributed scatter-gather and caching tier.',
          difficulty: 3
        },
        {
          requirement_ids: ['r2'],
          category: 'system-design',
          prompt: 'Design a live real-time leaderboard system for millions of concurrent players with rolling time windows.',
          answer_outline: 'Requirements: Real-time score updates, rank retrieval in O(log N), daily/weekly rolling boards. Architecture: Redis Sorted Sets (ZADD/ZREVRANK) partitioned by score tiers or shards. Persistence: Periodic snapshots to DynamoDB/MongoDB with append-only score event logs.',
          difficulty: 2
        }
      ];

      return formatQuestions(systemDesignBank, 8);
    }

    if (detectedCategory === 'company-fit') {
      const companyFitBank = [
        {
          requirement_ids: ['r1'],
          category: 'company-fit',
          prompt: 'Why are you specifically drawn to our engineering organization, and how does your background align with our core distributed platform mission?',
          answer_outline: 'Evidence: Reference the company overview and its focus on enterprise cloud solutions. Connection: Correlate candidate hands-on experience in high-availability systems with the company technology stack. Motivation: Highlight desire to solve domain-specific scalability challenges. Impact: Emphasize autonomous delivery and collaborative team culture.',
          difficulty: 1
        },
        {
          requirement_ids: ['r2'],
          category: 'company-fit',
          prompt: 'Based on what you understand about our product ecosystem and customers, what do you see as our primary engineering scaling challenge over the next 2 years?',
          answer_outline: 'Product Understanding: Articulate the core value proposition and customer profile. Technical Horizon: Identify bottlenecks in data ingestion, global multi-region tenancy, or real-time latency. Alignment: Share previous experience tackling parallel challenges in high-growth environments.',
          difficulty: 2
        },
        {
          requirement_ids: ['r3'],
          category: 'company-fit',
          prompt: 'Our engineering culture emphasizes high developer autonomy, rapid iteration, and blameless post-mortems. How do you practice these principles in your daily workflow?',
          answer_outline: 'Autonomy: Give concrete examples of owning architectural decisions end-to-end. Quality: Pair rapid prototyping with automated test coverage and feature flag rollouts. Culture: Describe active participation in blameless post-mortems focusing on systemic safeguards rather than individual fault.',
          difficulty: 2
        },
        {
          requirement_ids: ['r1'],
          category: 'company-fit',
          prompt: 'How do you balance shipping customer-facing features rapidly with maintaining the rigorous reliability standards required by our enterprise users?',
          answer_outline: 'Framework: Use tiered reliability budgets, automated regression gates, and canary releases. Customer Empathy: Understand when velocity delivers immediate user value vs when downtime erodes customer trust. Pragmatism: Implement minimum viable architecture that can cleanly evolve.',
          difficulty: 2
        },
        {
          requirement_ids: ['r2'],
          category: 'company-fit',
          prompt: 'Which aspects of our documented interview process and technical assessment approach stood out to you, and what does it indicate to you about how we value engineering?',
          answer_outline: 'Observation: Highlight focus on practical problem solving, architectural trade-offs, and communication over trivial leetcode puzzles. Reflection: Demonstrate understanding that the company values engineers who think holistically about systems, mentoring, and business context.',
          difficulty: 1
        },
        {
          requirement_ids: ['r3'],
          category: 'company-fit',
          prompt: 'How would you contribute to our engineering culture in terms of knowledge sharing, mentoring, and fostering technical excellence across teams?',
          answer_outline: 'Practices: Host architecture brown-bags, author internal RFCs, and maintain runbooks. Mentorship: Establish structured code review standards and pair-programming sessions. Community: Support inclusive onboarding and transparent cross-team engineering forums.',
          difficulty: 2
        },
        {
          requirement_ids: ['r1'],
          category: 'company-fit',
          prompt: 'How do you approach prioritizing competing requests between immediate sales commitments, core infrastructure investments, and product roadmap items?',
          answer_outline: 'Evaluation: Score items using impact vs effort, customer SLA risk, and architectural debt impact. Collaboration: Maintain transparent dialogue with Product Managers and Engineering Leadership. Consensus: Allocate fixed capacity bands to maintain platform health.',
          difficulty: 2
        },
        {
          requirement_ids: ['r2'],
          category: 'company-fit',
          prompt: 'What questions do you have for our engineering team regarding our architectural roadmap, team topology, or deployment cadence?',
          answer_outline: 'Inquiry Depth: Ask targeted questions regarding team ownership boundaries, deployment frequency, CI/CD flakiness, and observability tooling. Insight: Demonstrate deep interest in operational excellence and everyday developer ergonomics.',
          difficulty: 1
        },
        // Extra questions for rotation during regeneration
        {
          requirement_ids: ['r1'],
          category: 'company-fit',
          prompt: 'How do you evaluate whether a new architectural framework or open-source tool is appropriate for our production stack versus a distraction?',
          answer_outline: 'Criteria: Community health, maintenance cadence, security track record, operational overhead, and clear alignment with business bottlenecks. Protocol: Conduct bounded time-boxed spikes and RFC evaluations.',
          difficulty: 2
        },
        {
          requirement_ids: ['r2'],
          category: 'company-fit',
          prompt: 'In a remote and distributed engineering team, how do you ensure high-bandwidth communication and maintain strong cross-team collaboration?',
          answer_outline: 'Practices: Over-communicate in asynchronous written documents, maintain concise daily updates, use public Slack channels over DMs, and schedule targeted pairing sessions for blockers.',
          difficulty: 1
        }
      ];

      return formatQuestions(companyFitBank, 8);
    }

    // Default: Technical questions (10 high-impact senior engineering questions)
    const technicalBank = [
      {
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'How does the React reconciliation algorithm (Fiber) prioritize component updates during high-frequency state changes, and how do Concurrent Mode lanes work?',
        answer_outline: 'Concept: React Fiber represents component trees as linked lists of work units. Implementation: Updates are assigned bitmask lanes (Sync, InputContinuous, Default, Transition, Idle). Trade-offs: Cooperative multitasking via scheduler yields main thread to prevent UI freezing. Pitfalls: State tearing without useSyncExternalStore in concurrent reads.',
        difficulty: 3
      },
      {
        requirement_ids: ['r2'],
        category: 'technical',
        prompt: 'Explain the internal event loop phases in Node.js, and clarify precisely how process.nextTick() and microtasks differ from setImmediate().',
        answer_outline: 'Concept: Libuv event loop manages timers, pending callbacks, idle/prepare, poll, check, and close phases. Mechanics: process.nextTick and Promise microtasks execute immediately after the current operation finishes before the loop advances. Trade-offs: Starvation risk if recursive nextTick blocks I/O. Best practice: Use setImmediate for I/O check phase scheduling.',
        difficulty: 2
      },
      {
        requirement_ids: ['r3'],
        category: 'technical',
        prompt: 'How do compound indexes work in MongoDB, and what strategies should you use to optimize query execution and avoid in-memory sorting?',
        answer_outline: 'Concept: Compound indexes follow the Equality, Sort, Range (ESR) rule. Implementation: Place exact equality fields first, sort keys second, and range filters last. Verification: Analyze explain("executionStats") for IXSCAN vs COLLSCAN and verify totalDocsExamined matches nReturned. Pitfalls: In-memory sorts throw errors if result exceeds 32MB without index support.',
        difficulty: 2
      },
      {
        requirement_ids: ['r4', 'r2'],
        category: 'technical',
        prompt: 'How do Go goroutines differ from OS threads, and how does the Go runtime M:N scheduler handle blocking syscalls versus channel operations?',
        answer_outline: 'Concept: Goroutines have tiny starting stack (2KB) dynamically grown in heap, compared to 1MB+ OS threads. Mechanics: M:N scheduler maps G (goroutines) to M (OS threads) via P (logical processors). Work stealing allows idle Ps to grab runnable Gs. Blocking: Syscalls detach M from P, whereas channel operations park G without blocking the OS thread.',
        difficulty: 3
      },
      {
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'Explain how React useCallback, useMemo, and React.memo interact, and under what specific conditions memoization introduces net performance overhead.',
        answer_outline: 'Concept: React.memo shallowly compares props; useCallback preserves function identity; useMemo caches expensive return values. Overhead: Allocating dependency arrays and closure functions on every render incurs CPU and memory costs. When to use: Passing callbacks to virtualized lists or pure children with heavy renders. Pitfalls: Passing inline object literals in other props invalidates memoization.',
        difficulty: 2
      },
      {
        requirement_ids: ['r2'],
        category: 'technical',
        prompt: 'How would you diagnose, profile, and fix a memory leak in a long-running production Node.js service using heap snapshots and V8 inspector?',
        answer_outline: 'Diagnosis: Monitor RSS and heapUsed growth over time. Profiling: Take differential heap snapshots across load cycles using Chrome DevTools or v8-profiler. Common Causes: Global event emitter listener accumulation, uncollected closures, detached DOM/buffers. Fix: Use WeakMap/WeakSet, explicitly deregister listeners in cleanup handlers, and verify retained size drops.',
        difficulty: 3
      },
      {
        requirement_ids: ['r3'],
        category: 'technical',
        prompt: 'What are the architectural trade-offs between MongoDB document embedding versus referencing, and how do you handle high-write-volume 1-to-N relationships?',
        answer_outline: 'Trade-offs: Embedding provides atomic single-document reads and zero JOIN latency, bounded by 16MB document size limit. Referencing supports unbounded collections but requires multi-document transactions or application-level lookups. High-write: Use bucket pattern or separate audit collections with write concern w:1 or w:majority.',
        difficulty: 2
      },
      {
        requirement_ids: ['r2'],
        category: 'technical',
        prompt: 'How do you secure Node.js REST APIs against Server-Side Request Forgery (SSRF), Prototype Pollution, and ReDoS attacks in production?',
        answer_outline: 'SSRF: Resolve DNS before request, validate against private IP ranges (RFC 1918/4193), disable redirects, and enforce HTTP/HTTPS whitelist. Prototype Pollution: Freeze Object.prototype, use Object.create(null), or validate JSON against strict Zod/Ajv schemas. ReDoS: Avoid polynomial regex backtracking and use safe regex engines (e.g. re2) with timeouts.',
        difficulty: 3
      },
      {
        requirement_ids: ['r1', 'r2'],
        category: 'technical',
        prompt: 'How do you design a robust state management and optimistic UI update layer in TypeScript that handles rollback on server rejection?',
        answer_outline: 'Concept: Optimistic updates apply mutations immediately to client cache with an rollback snapshot. Implementation: Generate temporary client UUID, append to store, fire mutation API. Rollback: If API returns error (4xx/5xx), revert store to snapshot and notify user with toast/retry action. Pitfalls: Handling out-of-order race conditions with sequence IDs.',
        difficulty: 2
      },
      {
        requirement_ids: ['r3', 'r2'],
        category: 'technical',
        prompt: 'How do database connection pools work in Node.js with MongoDB/PostgreSQL, and how do you size pool min/max parameters to prevent server starvation?',
        answer_outline: 'Mechanics: Pool maintains open TCP connections, reusing them across incoming HTTP requests. Sizing: Formula `max = (cores * 2) + effective_spindle_count` adapted for async event loop. Over-allocation: Excessive pool size causes database thread context switching and lock contention. Best Practice: Set acquire timeout and queue limits to fail fast under backpressure.',
        difficulty: 2
      },
      // Extra questions for rotation during regeneration
      {
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'How do TypeScript conditional types, distributive types, and the `infer` keyword enable type-safe API schema inference?',
        answer_outline: 'Concept: Conditional types take form `T extends U ? X : Y`. Distributive: Naked type parameters distribute over union types. Infer: Extracts nested generic types (e.g. UnpackPromise<T> = T extends Promise<infer U> ? U : T). Application: Used in Zod and tRPC to infer runtime schema types automatically without code duplication.',
        difficulty: 3
      },
      {
        requirement_ids: ['r2'],
        category: 'technical',
        prompt: 'How do streams and backpressure work in Node.js, and how does pipeline() prevent out-of-memory errors during large file transformations?',
        answer_outline: 'Mechanics: Readable streams push to buffer; when highWaterMark is exceeded, write() returns false and producer pauses until drain event. Pipeline: Handles proper cleanup, event listener attachment, and error propagation across transform and writable streams without memory leaks.',
        difficulty: 2
      }
    ];

    return formatQuestions(technicalBank, 10);
  }

  private mockFlashcards(systemPrompt: string = '', userPrompt: string = ''): any[] {
    const reqMatches = Array.from((systemPrompt + ' ' + userPrompt).matchAll(/\[(r\d+)\]/g)).map(m => m[1]);
    const targetReqIds = Array.from(new Set(reqMatches));
    const defaultFlashcards = [
      {
        front: 'What is the primary benefit of the React Fiber reconciliation architecture?',
        back: 'Fiber splits rendering into interruptible units of work, enabling lane-based prioritization and smooth UI responsiveness without blocking the main thread.',
        requirement_ids: ['r1']
      },
      {
        front: 'How does Node.js handle concurrent I/O operations despite being single-threaded?',
        back: 'Via the Libuv event loop backed by an OS-level epoll/kqueue notification system and a thread pool for non-blocking asynchronous operations.',
        requirement_ids: ['r2']
      },
      {
        front: 'What is the ESR (Equality, Sort, Range) rule in MongoDB indexing?',
        back: 'Compound index keys should be ordered: 1) Equality fields first, 2) Sort fields second, 3) Range fields last to minimize scanned keys.',
        requirement_ids: ['r3']
      },
      {
        front: 'How do goroutines achieve lower memory overhead than OS threads in Go?',
        back: 'Goroutines initialize with a dynamic 2KB stack that expands and shrinks on demand, whereas OS threads typically allocate a fixed 1MB–2MB stack.',
        requirement_ids: ['r4']
      },
      {
        front: 'What is the purpose of the React useSyncExternalStore hook?',
        back: 'It subscribes to external concurrent data stores synchronously, preventing tearing (visual inconsistencies) during concurrent React renders.',
        requirement_ids: ['r1']
      },
      {
        front: 'What is Server-Side Request Forgery (SSRF) and how is it prevented?',
        back: 'SSRF occurs when an attacker induces a server to make requests to internal resources; prevented by DNS resolution checks and private IP blacklisting.',
        requirement_ids: ['r2']
      },
      {
        front: 'What is the Difference between process.nextTick() and setImmediate() in Node.js?',
        back: 'process.nextTick() executes immediately after the current operation in the microtask queue; setImmediate() executes during the check phase of the event loop.',
        requirement_ids: ['r2']
      },
      {
        front: 'What are the trade-offs of embedding vs referencing documents in MongoDB?',
        back: 'Embedding provides atomic single-document reads without joins (up to 16MB); referencing avoids document size bloat and supports unbounded 1-to-N relationships.',
        requirement_ids: ['r3']
      },
      {
        front: 'How does a distributed sliding window rate limiter work in Redis?',
        back: 'It tracks timestamps in a Redis sorted set (ZADD), removes entries older than the window (ZREMRANGEBYSCORE), and counts remaining items (ZCARD) atomically via Lua.',
        requirement_ids: ['r2', 'r3']
      },
      {
        front: 'What is the Saga pattern in distributed microservices?',
        back: 'A design pattern that coordinates transactions across multiple services using a sequence of local transactions and compensating transactions for rollbacks.',
        requirement_ids: ['r2']
      },
      {
        front: 'What is the Outbox Pattern in event-driven architecture?',
        back: 'It guarantees reliable message publishing by saving domain events in a database table within the same local transaction as entity state before publishing to a broker.',
        requirement_ids: ['r2', 'r3']
      },
      {
        front: 'What is Backpressure in streaming architectures?',
        back: 'A signaling mechanism where downstream consumers indicate inability to process incoming data rates, causing upstream producers to throttle emissions.',
        requirement_ids: ['r2']
      },
      {
        front: 'What is the purpose of Docker multi-stage builds in production deployment?',
        back: 'They separate build-time compilers and devDependencies from runtime images, producing minimal, secure production containers with smaller attack surfaces.',
        requirement_ids: ['r5']
      },
      {
        front: 'What is the STAR framework for behavioral interviews?',
        back: 'A structured answering model: Situation (context), Task (objective/challenge), Action (specific steps you led), Result (measurable impact & reflection).',
        requirement_ids: ['r6']
      },
      {
        front: 'What is the difference between Optimistic and Pessimistic concurrency control?',
        back: 'Optimistic assumes conflicts are rare and validates versions at commit time; pessimistic locks resources up front, preventing concurrent modifications.',
        requirement_ids: ['r3']
      },
      {
        front: 'What is a Thundering Herd problem in caching and how is it mitigated?',
        back: 'Occurs when multiple concurrent requests miss cache on key expiry simultaneously; mitigated via distributed locks (single-flight) or probabilistic early expiration.',
        requirement_ids: ['r3']
      },
      {
        front: 'What is the difference between Horizontal and Vertical database partitioning?',
        back: 'Horizontal partitioning (sharding) splits rows across multiple nodes; vertical partitioning splits columns or tables by domain boundaries.',
        requirement_ids: ['r3']
      },
      {
        front: 'How does TypeScript `infer` work inside conditional types?',
        back: 'It introduces a type variable within a condition (`T extends Promise<infer R> ? R : T`) to deduce and extract nested types dynamically.',
        requirement_ids: ['r1']
      },
      {
        front: 'What is Idempotency and why is it essential in HTTP API design?',
        back: 'An operation is idempotent if executing it multiple times produces identical state as executing it once (e.g. PUT/DELETE, or POST with Idempotency-Key).',
        requirement_ids: ['r2']
      },
      {
        front: 'What is the purpose of Blameless Post-Mortems in engineering organizations?',
        back: 'To investigate systemic root causes of production outages without pointing fingers, focusing on improving safeguards, monitoring, and automated failover.',
        requirement_ids: ['r6']
      }
    ];

    if (targetReqIds.length > 0) {
      return defaultFlashcards.map((f, idx) => ({
        ...f,
        requirement_ids: [targetReqIds[idx % targetReqIds.length]]
      }));
    }

    return defaultFlashcards;
  }
}
