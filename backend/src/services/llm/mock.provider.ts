import { LLMService } from './llm.interface.js';

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

    // 1. Question Generation & Gap Closure
    if (sysLower.includes('interviewer') || sysLower.includes('question') || sysLower.includes('coverage gap')) {
      return this.mockQuestions(sysLower + ' ' + userLower) as unknown as T;
    }

    // 2. Requirement Extraction
    if (sysLower.includes('extract requirements') || sysLower.includes('requirement parser')) {
      return this.mockRequirements(userLower) as unknown as T;
    }

    // 3. Flashcards
    if (sysLower.includes('flashcard')) {
      return [
        {
          front: 'What is the primary benefit of React hooks?',
          back: 'Hooks allow functional components to use state and lifecycle methods without class components.',
          requirement_ids: ['r1']
        },
        {
          front: 'How does Node.js handle concurrent I/O operations?',
          back: 'Via the single-threaded Event Loop backed by libuv thread pool for asynchronous non-blocking I/O.',
          requirement_ids: ['r2']
        }
      ] as unknown as T;
    }

    // 4. Role Breakdown
    if (sysLower.includes('recruiter') && (sysLower.includes('seniority') || sysLower.includes('responsibilities'))) {
      return {
        title: 'Senior Software Engineer',
        seniority: 'Senior',
        responsibilities: [
          'Design and maintain scalable distributed backend services.',
          'Lead technical discussions and architectural reviews.',
          'Mentor junior team members and foster engineering best practices.'
        ]
      } as unknown as T;
    }

    // 5. Company Brief
    if (sysLower.includes('analyst') || sysLower.includes('company overview') || sysLower.includes('what_they_do')) {
      return {
        summary: 'Leading cloud-native software and infrastructure organization.',
        what_they_do: 'Develops enterprise-grade distributed observability and performance management platforms.',
        sources: ['https://example.com/about']
      } as unknown as T;
    }

    // Generic fallback object
    return [] as unknown as T;
  }

  private mockRequirements(userPrompt: string): any[] {
    const text = userPrompt.toLowerCase();
    const requirements: any[] = [];
    let rCount = 1;

    // Detect technical keywords
    if (text.includes('react')) {
      requirements.push({
        id: `r${rCount++}`,
        text: '5+ years experience with React and modern frontend state management',
        kind: 'technical',
        priority: 'must'
      });
    }
    if (text.includes('node') || text.includes('express')) {
      requirements.push({
        id: `r${rCount++}`,
        text: 'Strong proficiency in Node.js, Express, and RESTful API architecture',
        kind: 'technical',
        priority: 'must'
      });
    }
    if (text.includes('mongodb') || text.includes('database')) {
      requirements.push({
        id: `r${rCount++}`,
        text: 'Database schema design and query optimization with MongoDB',
        kind: 'technical',
        priority: 'must'
      });
    }
    if (text.includes('go') || text.includes('golang')) {
      requirements.push({
        id: `r${rCount++}`,
        text: '3+ years writing concurrent backend services in Go',
        kind: 'technical',
        priority: 'must'
      });
    }
    if (text.includes('kubernetes') || text.includes('docker') || text.includes('aws')) {
      const isBonus = text.includes('nice') || text.includes('bonus') || text.includes('plus');
      requirements.push({
        id: `r${rCount++}`,
        text: 'Experience with containerization (Docker, Kubernetes) and cloud infrastructure',
        kind: 'technical',
        priority: isBonus ? 'nice' : 'must'
      });
    }

    // Behavioral keywords
    if (text.includes('mentor') || text.includes('lead') || text.includes('junior')) {
      requirements.push({
        id: `r${rCount++}`,
        text: 'Mentoring junior and mid-level software engineers through structured feedback',
        kind: 'behavioural',
        priority: 'must'
      });
    }

    // Fallback for thin JD
    if (requirements.length === 0) {
      requirements.push({
        id: 'r1',
        text: 'Core software engineering skills as stated in job description',
        kind: 'technical',
        priority: 'must'
      });
    }

    return requirements;
  }

  private mockQuestions(userPrompt: string): any[] {
    const promptLower = userPrompt.toLowerCase();

    if (promptLower.includes('behavioural')) {
      return [
        {
          requirement_ids: ['r5'],
          category: 'behavioural',
          prompt: 'Describe a time when you guided a junior engineer through an architectural bottleneck. How did you balance coaching with delivery?',
          answer_outline: 'Use the STAR method: Situation, Task, Coaching Approach, and Result.',
          difficulty: 2
        }
      ];
    }

    if (promptLower.includes('system-design')) {
      return [
        {
          requirement_ids: ['r3'],
          category: 'system-design',
          prompt: 'Design a distributed telemetry ingestion pipeline capable of handling 500,000 events per second with high availability.',
          answer_outline: 'Address load balancing, Kafka/queue buffering, worker processing, and MongoDB indexing strategies.',
          difficulty: 3
        }
      ];
    }

    if (promptLower.includes('company-fit')) {
      return [
        {
          requirement_ids: ['r1'],
          category: 'company-fit',
          prompt: 'Why are you interested in joining our engineering culture, and how do our company values resonate with your approach?',
          answer_outline: 'Connect personal engineering values with company mission and product impact.',
          difficulty: 1
        }
      ];
    }

    // Technical questions (default)
    return [
      {
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'How does the React reconciliation algorithm (Fiber) prioritize component updates during high-frequency state changes?',
        answer_outline: 'Explain Fiber nodes, work-in-progress trees, lane-based prioritization, and concurrent mode scheduling.',
        difficulty: 3
      },
      {
        requirement_ids: ['r2'],
        category: 'technical',
        prompt: 'Explain event loop phases in Node.js and how process.nextTick() differs from setImmediate().',
        answer_outline: 'Walk through timers, pending callbacks, poll, check, and close callbacks phases. Clarify microtask queue execution order.',
        difficulty: 2
      }
    ];
  }
}
