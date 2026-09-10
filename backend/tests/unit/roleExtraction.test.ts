import { describe, it, expect } from 'vitest';
import { generateRoleBreakdown, heuristicExtractRole } from '../../src/services/generation/roleGenerator.js';
import { extractRequirements, heuristicExtract } from '../../src/services/generation/requirementExtractor.js';
import { MockLLMProvider } from '../../src/services/llm/mock.provider.js';

describe('Role & Skills Extraction Engine (Trao Assessment Compliance)', () => {
  const llm = new MockLLMProvider();

  // Test Case 1: Microsoft Senior Software Engineer with Go backend
  const microsoftGoJd = `Microsoft
Senior Software Engineer - Distributed Cloud Services

About the Role:
We are seeking a Senior Software Engineer to build scalable, high-throughput cloud infrastructure services for our core platform.

Responsibilities:
- Design and maintain scalable distributed backend services in Go.
- Lead technical discussions and architectural reviews across cross-functional teams.
- Mentor junior and mid-level team members and foster engineering best practices.
- Optimize concurrency models, memory allocation, and low-latency network I/O.
- Implement telemetry, automated testing, and CI/CD pipelines for zero-downtime deployments.

Requirements (Must Have):
- 5+ years of software engineering experience.
- 3+ years writing concurrent backend services in Go.
- Proven experience with distributed systems architecture and microservices.
- Track record of mentoring junior engineers and leading design reviews.
- Bachelor's degree in Computer Science or equivalent practical experience.

Nice to Have (Bonus):
- Experience with gRPC and cloud telemetry systems.
- Familiarity with high-throughput stream processing with Kafka.`;

  it('1. should extract ALL responsibilities without stopping at 3', async () => {
    const requirements = await extractRequirements(microsoftGoJd, llm);
    const role = await generateRoleBreakdown(microsoftGoJd, requirements, 'Microsoft', llm);

    expect(role.responsibilities.length).toBeGreaterThanOrEqual(5);
    expect(role.responsibilities).toContain('Design and maintain scalable distributed backend services in Go.');
    expect(role.responsibilities).toContain('Mentor junior and mid-level team members and foster engineering best practices.');
    expect(role.responsibilities).toContain('Optimize concurrency models, memory allocation, and low-latency network I/O.');
  });

  it('2. should categorize technical skills strictly cited in the JD', async () => {
    const requirements = await extractRequirements(microsoftGoJd, llm);
    const role = await generateRoleBreakdown(microsoftGoJd, requirements, 'Microsoft', llm);

    expect(role.technical_skills).toBeDefined();
    expect(role.technical_skills!['Programming Languages']).toContain('Go');
    expect(role.technical_skills!['Architecture & Distributed Systems']).toContain('Distributed Systems');
    expect(role.technical_skills!['Architecture & Distributed Systems']).toContain('Concurrency');
    expect(role.technical_skills!['Architecture & Distributed Systems']).toContain('Kafka');
    expect(role.technical_skills!['Backend Technologies']).toContain('gRPC');

    // STRICT ZERO-HALLUCINATION RULE: Docker, AWS, React, MongoDB should NOT be present
    const allSkills = Object.values(role.technical_skills!).flat();
    expect(allSkills).not.toContain('Docker');
    expect(allSkills).not.toContain('AWS');
    expect(allSkills).not.toContain('React');
    expect(allSkills).not.toContain('MongoDB');
  });

  it('3 & 4. should extract multiple must-have and nice-to-have requirements with correct counts', async () => {
    const requirements = await extractRequirements(microsoftGoJd, llm);

    const mustReqs = requirements.filter(r => r.priority === 'must');
    const niceReqs = requirements.filter(r => r.priority === 'nice');

    expect(mustReqs.length).toBeGreaterThanOrEqual(4);
    expect(niceReqs.length).toBeGreaterThanOrEqual(2);

    // Verify nice-to-have content
    const niceTexts = niceReqs.map(r => r.text.toLowerCase());
    expect(niceTexts.some(t => t.includes('grpc') || t.includes('telemetry'))).toBe(true);
    expect(niceTexts.some(t => t.includes('kafka') || t.includes('stream processing'))).toBe(true);
  });

  it('5 & 6. should extract experience and education accurately', async () => {
    const requirements = await extractRequirements(microsoftGoJd, llm);
    const role = await generateRoleBreakdown(microsoftGoJd, requirements, 'Microsoft', llm);

    expect(role.experience).toContain('5+ years');
    expect(role.education).toBeDefined();
    expect(role.education!.some(e => /bachelor|computer science/i.test(e))).toBe(true);
  });

  it('7 & 8. should extract soft skills and domain skills explicitly supported by JD', async () => {
    const requirements = await extractRequirements(microsoftGoJd, llm);
    const role = await generateRoleBreakdown(microsoftGoJd, requirements, 'Microsoft', llm);

    expect(role.soft_skills).toBeDefined();
    expect(role.soft_skills!).toContain('Mentorship & Coaching');
    expect(role.soft_skills!).toContain('Technical Leadership');

    expect(role.domain_skills).toBeDefined();
    expect(role.domain_skills!).toContain('Distributed Systems Architecture');
  });

  it('9. should deduplicate semantically duplicate requirements', async () => {
    const duplicateJd = `
Software Engineer
Requirements:
- 3+ years writing concurrent backend services in Go
- 3+ years writing concurrent backend services in Go
- Experience with distributed systems
- Experience with distributed systems
`;
    const requirements = await extractRequirements(duplicateJd, llm);
    expect(requirements.length).toBe(2);
    expect(requirements[0].id).toBe('r1');
    expect(requirements[1].id).toBe('r2');
  });

  it('10. should provide clear fallback for missing optional fields', async () => {
    const minimalJd = `Software Engineer. Build web interfaces.`;
    const requirements = await extractRequirements(minimalJd, llm);
    const role = await generateRoleBreakdown(minimalJd, requirements, 'Acme', llm);

    expect(role.work_mode).toBe('Not specified in job description');
    expect(role.employment_type).toBe('Not specified in job description');
    expect(role.compensation).toBe('Not specified in job description');
  });

  it('11. should assign stable, server-controlled sequential IDs (r1, r2, ...)', async () => {
    const requirements = await extractRequirements(microsoftGoJd, llm);
    requirements.forEach((req, idx) => {
      expect(req.id).toBe(`r${idx + 1}`);
      expect(req.metadata?.source).toBe('generated');
    });
  });

  it('12. should construct responsibility-to-skill and requirement-to-skill mappings', async () => {
    const requirements = await extractRequirements(microsoftGoJd, llm);
    const role = await generateRoleBreakdown(microsoftGoJd, requirements, 'Microsoft', llm);

    expect(role.responsibility_skill_map).toBeDefined();
    const mappedSkills = Object.values(role.responsibility_skill_map!).flat();
    expect(mappedSkills).toContain('Go');

    expect(role.requirement_skill_map).toBeDefined();
    expect(Object.keys(role.requirement_skill_map!).length).toBeGreaterThan(0);
  });

  it('13 & 14. should not hallucinate Go for JDs that only have MongoDB', async () => {
    const mongoJd = `Full Stack Engineer
Key Responsibilities:
- Build database pipelines using MongoDB and Node.js.
Requirements:
- Strong experience with MongoDB database design.`;

    const requirements = await extractRequirements(mongoJd, llm);
    const role = await generateRoleBreakdown(mongoJd, requirements, 'Acme', llm);

    const allSkills = Object.values(role.technical_skills || {}).flat();
    expect(allSkills).toContain('MongoDB');
    expect(allSkills).toContain('Node.js');
    expect(allSkills).not.toContain('Go');

    const reqTexts = requirements.map(r => r.text.toLowerCase());
    expect(reqTexts.some(t => t.includes('concurrent backend services in go'))).toBe(false);
  });
});
