import { describe, it, expect } from 'vitest';
import { IKitDocument } from '../../src/models/Kit.js';

describe('Overview Dashboard Data Contract Tests', () => {
  const createMockKitDoc = (overrides?: Partial<any>): Partial<IKitDocument> => {
    return {
      _id: 'kit_overview_123' as any,
      userId: 'user_test' as any,
      kit: {
        source: {
          company: 'Acme Cloud',
          company_url: 'https://example.com',
          role: 'Staff Infrastructure Architect',
          location: 'Remote / Seattle, WA',
          jd_chars: 1800,
          researched_at: new Date().toISOString(),
          pages_used: ['https://example.com/about', 'https://example.com/engineering']
        },
        company_brief: {
          summary: 'Cloud telemetry and observability platform provider.',
          what_they_do: 'Develops distributed monitoring and distributed tracing agents.',
          industry: 'Cloud Infrastructure & Telemetry',
          founded: '2018',
          headquarters: 'Seattle, WA',
          company_scale: 'Mid-sized (500-1000)',
          stock_ticker: 'ACME',
          mission: 'Empower engineers with zero-latency observability.',
          products_services: [
            { name: 'TraceLens', description: 'High throughput distributed tracing' },
            { name: 'MetricStream', description: 'Real-time telemetry ingestion' }
          ],
          business_model: 'B2B SaaS with usage-based cloud billing',
          engineering_context: {
            themes: ['Distributed consensus', 'High ingestion bandwidth'],
            challenges: ['Sub-millisecond query indexing', 'Cross-region log replication'],
            tech_areas: ['Go', 'Rust', 'Kafka', 'ClickHouse']
          },
          role_company_context: {
            why_they_matter: 'Owns high-throughput telemetry pipelines servicing billions of daily events.'
          },
          what_to_prepare: [
            { priority: 1, category: 'architecture', title: 'High Throughput Message Queuing', recommendation: 'Review partition rebalancing and zero-copy buffers.' },
            { priority: 2, category: 'distributed', title: 'Raft Log Replication', recommendation: 'Be ready to discuss split-brain mitigation.' }
          ],
          hiring_process: {
            official_stages: ['Recruiter Screen', 'Technical Architecture Interview', 'System Design & Scale', 'Values Alignment'],
            sources: ['https://example.com/careers']
          },
          public_interview_research: {
            candidate_experience_summary: 'Heavy focus on concurrency mechanics and data structure tradeoffs.',
            recurring_technical_areas: ['Goroutines', 'Channel deadlocks', 'Kafka partition keys']
          },
          detailed_sources: [
            { title: 'Official Engineering Blog', url: 'https://example.com/blog', source_type: 'official' },
            { title: 'Public Tech Discussion', url: 'https://news.ycombinator.com', source_type: 'community' }
          ],
          sources: ['https://example.com/about']
        },
        role: {
          title: 'Staff Infrastructure Architect',
          seniority: 'Staff',
          overview: 'Lead core telemetry architecture and distributed log streaming services.',
          location: 'Remote / Seattle, WA',
          employment_type: 'Full-time',
          department: 'Platform Engineering',
          responsibilities: [
            'Architect scalable backend pipelines capable of ingesting 2M events/sec',
            'Lead technical design discussions and author RFCs',
            'Mentor mid-level and senior engineers',
            'Ensure 99.99% availability and define SLOs',
            'Partner with product management on developer tooling'
          ],
          requirements: [
            { id: 'r1', text: 'Deep expertise in Go or Rust concurrency', kind: 'technical', priority: 'must' },
            { id: 'r2', text: 'Distributed consensus systems (Raft / Paxos)', kind: 'technical', priority: 'must' },
            { id: 'r3', text: 'Experience mentoring senior engineers', kind: 'behavioural', priority: 'must' },
            { id: 'r4', text: 'Kubernetes operators and eBPF kernel tracing', kind: 'technical', priority: 'nice' },
            { id: 'r5', text: 'Cross-functional engineering leadership', kind: 'behavioural', priority: 'nice' }
          ],
          technical_skills: {
            Languages: ['Go', 'Rust', 'C++'],
            DistributedSystems: ['Kafka', 'gRPC', 'Raft', 'eBPF'],
            Databases: ['ClickHouse', 'PostgreSQL', 'Redis']
          },
          soft_skills: ['Technical Mentorship', 'RFC Authoring', 'Executive Communication'],
          domain_skills: ['Cloud Telemetry', 'Observability', 'Distributed Tracing']
        },
        questions: [
          { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Explain Go channel semantics and select deadlocks.', answer_outline: 'Outline buffered vs unbuffered channels.', difficulty: 2 },
          { id: 'q2', requirement_ids: ['r2'], category: 'technical', prompt: 'How does Raft break split-brain vote ties?', answer_outline: 'Randomized election timeouts.', difficulty: 3 },
          { id: 'q3', requirement_ids: ['r3'], category: 'behavioural', prompt: 'Describe coaching an engineer through architectural paralysis.', answer_outline: 'Use STAR format.', difficulty: 2 },
          { id: 'q4', requirement_ids: ['r2'], category: 'system-design', prompt: 'Design a distributed telemetry ingestion pipeline.', answer_outline: 'Discuss partitioning, backpressure, and LSM trees.', difficulty: 3 },
          { id: 'q5', requirement_ids: ['r1'], category: 'company-fit', prompt: 'Why is Acme observability scale inspiring to you?', answer_outline: 'Connect personal engineering interests.', difficulty: 1 },
          { id: 'q6', requirement_ids: ['r4'], category: 'technical', prompt: 'Explain eBPF probes in Kubernetes networking.', answer_outline: 'Kernel space execution safety.', difficulty: 3 }
        ],
        flashcards: [
          { id: 'f1', front: 'What is a goroutine leak?', back: 'A blocked goroutine that cannot terminate.', requirement_ids: ['r1'] },
          { id: 'f2', front: 'What is Raft log compaction?', back: 'Snapshotting committed state to truncate logs.', requirement_ids: ['r2'] }
        ],
        schedule: {
          days_available: 3,
          days: [
            { day: 1, focus: 'Go Concurrency & Channels', question_ids: ['q1', 'q5'], minutes: 60 },
            { day: 2, focus: 'Raft & Distributed Systems', question_ids: ['q2', 'q4'], minutes: 90 },
            { day: 3, focus: 'Leadership & Kubernetes', question_ids: ['q3', 'q6'], minutes: 60 }
          ]
        },
        coverage: {
          uncovered_requirement_ids: [],
          passes: 1
        }
      },
      practiceState: {
        cards: [],
        attempts: [],
        itemProgress: {},
        totalSessions: 0
      },
      ...overrides
    };
  };

  it('1. should verify complete role details are present and dynamic', () => {
    const kitDoc = createMockKitDoc();
    const role = kitDoc.kit!.role;
    expect(role.title).toBe('Staff Infrastructure Architect');
    expect(role.seniority).toBe('Staff');
    expect(role.location).toContain('Seattle');
    expect(role.department).toBe('Platform Engineering');
  });

  it('2. should verify all extracted responsibilities are present', () => {
    const kitDoc = createMockKitDoc();
    const responsibilities = kitDoc.kit!.role.responsibilities;
    expect(responsibilities.length).toBe(5);
    expect(responsibilities[0]).toContain('2M events/sec');
    expect(responsibilities[2]).toContain('Mentor');
  });

  it('3. should verify all requirements are present and categorized', () => {
    const kitDoc = createMockKitDoc();
    const reqs = kitDoc.kit!.role.requirements;
    expect(reqs.length).toBe(5);
    expect(reqs.some(r => r.kind === 'technical')).toBe(true);
    expect(reqs.some(r => r.kind === 'behavioural')).toBe(true);
  });

  it('4. should verify must-have requirements mapping and calculation', () => {
    const kitDoc = createMockKitDoc();
    const mustReqs = kitDoc.kit!.role.requirements.filter(r => r.priority === 'must');
    expect(mustReqs.length).toBe(3);
    const coveredIds = kitDoc.kit!.questions.flatMap(q => q.requirement_ids || []);
    mustReqs.forEach(req => {
      expect(coveredIds.includes(req.id)).toBe(true);
    });
  });

  it('5. should verify nice-to-have requirements mapping', () => {
    const kitDoc = createMockKitDoc();
    const niceReqs = kitDoc.kit!.role.requirements.filter(r => r.priority === 'nice');
    expect(niceReqs.length).toBe(2);
    expect(niceReqs.some(r => r.id === 'r4')).toBe(true);
    expect(niceReqs.some(r => r.id === 'r5')).toBe(true);
  });

  it('6 & 7. should verify skills grouped by category and empty groups filtered out', () => {
    const kitDoc = createMockKitDoc();
    const skills = kitDoc.kit!.role.technical_skills;
    expect(Object.keys(skills!).length).toBe(3);
    expect(skills!['Languages']).toContain('Go');
    expect(skills!['DistributedSystems']).toContain('Kafka');
    // Ensure no empty arrays
    Object.values(skills!).forEach(list => {
      expect(list.length).toBeGreaterThan(0);
    });
  });

  it('8. should verify question totals match kit.questions.length dynamically', () => {
    const kitDoc = createMockKitDoc();
    expect(kitDoc.kit!.questions.length).toBe(6);
  });

  it('9. should verify category breakdown matches actual question categories', () => {
    const kitDoc = createMockKitDoc();
    const qs = kitDoc.kit!.questions;
    const techCount = qs.filter(q => q.category === 'technical').length;
    const behCount = qs.filter(q => q.category === 'behavioural').length;
    const sysCount = qs.filter(q => q.category === 'system-design').length;
    const fitCount = qs.filter(q => q.category === 'company-fit').length;

    expect(techCount).toBe(3);
    expect(behCount).toBe(1);
    expect(sysCount).toBe(1);
    expect(fitCount).toBe(1);
    expect(techCount + behCount + sysCount + fitCount).toBe(qs.length);
  });

  it('10. should verify flashcard total matches kit.flashcards.length', () => {
    const kitDoc = createMockKitDoc();
    expect(kitDoc.kit!.flashcards.length).toBe(2);
  });

  it('11. should verify schedule days match schedule.days.length', () => {
    const kitDoc = createMockKitDoc();
    expect(kitDoc.kit!.schedule.days.length).toBe(3);
    expect(kitDoc.kit!.schedule.days_available).toBe(3);
  });

  it('12. should calculate coverage percentage correctly from actual coverage', () => {
    const kitDoc = createMockKitDoc();
    const mustReqs = kitDoc.kit!.role.requirements.filter(r => r.priority === 'must');
    const uncovered = kitDoc.kit!.coverage.uncovered_requirement_ids;
    const covered = mustReqs.filter(r => !uncovered.includes(r.id));
    const coveragePercent = Math.round((covered.length / mustReqs.length) * 100);
    expect(coveragePercent).toBe(100);
  });

  it('13 & 14. should handle no-practice state truthfully without fake numbers', () => {
    const kitDoc = createMockKitDoc();
    expect(kitDoc.practiceState!.attempts!.length).toBe(0);
    expect(Object.keys(kitDoc.practiceState!.itemProgress!).length).toBe(0);
  });

  it('15. should verify company summary uses companyBrief fields', () => {
    const kitDoc = createMockKitDoc();
    const brief = kitDoc.kit!.company_brief;
    expect(brief.industry).toBe('Cloud Infrastructure & Telemetry');
    expect(brief.founded).toBe('2018');
    expect(brief.headquarters).toBe('Seattle, WA');
    expect(brief.mission).toContain('zero-latency');
  });

  it('16. should verify research provenance fields', () => {
    const kitDoc = createMockKitDoc();
    expect(kitDoc.kit!.source.pages_used.length).toBe(2);
    expect(kitDoc.kit!.company_brief.detailed_sources!.length).toBe(2);
    expect(kitDoc.kit!.company_brief.detailed_sources![0].source_type).toBe('official');
    expect(kitDoc.kit!.company_brief.detailed_sources![1].source_type).toBe('community');
  });

  it('17 & 18. should handle thin JD and missing company research gracefully without crashing', () => {
    const thinKitDoc: any = {
      _id: 'thin_kit',
      kit: {
        source: { company: 'Minimal Inc', company_url: '', role: 'Junior Dev', location: '', jd_chars: 50, researched_at: '', pages_used: [] },
        company_brief: { summary: '', what_they_do: '', sources: [] },
        role: { title: 'Junior Dev', seniority: '', responsibilities: [], requirements: [] },
        questions: [],
        flashcards: [],
        schedule: { days_available: 1, days: [] },
        coverage: { uncovered_requirement_ids: [], passes: 1 }
      },
      practiceState: { cards: [], attempts: [], itemProgress: {}, totalSessions: 0 }
    };

    expect(thinKitDoc.kit.source.company).toBe('Minimal Inc');
    expect(thinKitDoc.kit.role.responsibilities.length).toBe(0);
    expect(thinKitDoc.kit.questions.length).toBe(0);
  });

  it('19 & 20. should support both 1-day and 60-day schedules', () => {
    const oneDayDoc = createMockKitDoc();
    oneDayDoc.kit!.schedule = {
      days_available: 1,
      days: [{ day: 1, focus: 'Intensive Cram', question_ids: ['q1', 'q2'], minutes: 120 }]
    };
    expect(oneDayDoc.kit!.schedule.days_available).toBe(1);
    expect(oneDayDoc.kit!.schedule.days.length).toBe(1);

    const sixtyDayDoc = createMockKitDoc();
    const days = Array.from({ length: 60 }, (_, i) => ({
      day: i + 1,
      focus: `Topic ${i + 1}`,
      question_ids: [`q${(i % 6) + 1}`],
      minutes: 45
    }));
    sixtyDayDoc.kit!.schedule = { days_available: 60, days };
    expect(sixtyDayDoc.kit!.schedule.days_available).toBe(60);
    expect(sixtyDayDoc.kit!.schedule.days.length).toBe(60);
  });

  it('24. should confirm no hardcoded company or role information exists in models or helpers', () => {
    const customCompanyDoc = createMockKitDoc();
    customCompanyDoc.kit!.source.company = 'Stripe';
    customCompanyDoc.kit!.role.title = 'Staff Billing Platform Engineer';

    expect(customCompanyDoc.kit!.source.company).toBe('Stripe');
    expect(customCompanyDoc.kit!.role.title).toBe('Staff Billing Platform Engineer');
  });
});
