import { LLMService } from '../llm/llm.interface.js';
import { Requirement, RoleBreakdown } from '../../types/kit.js';
import { buildSafePrompt } from '../llm/promptSanitizer.js';

interface RawRoleInfo {
  title: string;
  normalized_title?: string;
  seniority: string;
  overview?: string;
  employment_type?: string;
  work_mode?: string;
  location?: string;
  department?: string;
  job_family?: string;
  experience?: string;
  education?: string[];
  certifications?: string[];
  responsibilities: string[];
  technical_skills?: Record<string, string[]>;
  soft_skills?: string[];
  domain_skills?: string[];
  responsibility_skill_map?: Record<string, string[]>;
  compensation?: string;
  benefits?: string[];
  work_authorization?: string;
}

export async function generateRoleBreakdown(
  jd: string,
  requirements: Requirement[],
  companyName: string,
  llm: LLMService
): Promise<RoleBreakdown> {
  const cleanJd = (jd || '').trim();

  const trustedInstructions = `
You are an expert technical recruiting architect and information extraction specialist.
Analyze the provided Job Description (JD) and extract a complete, structured, and strictly JD-grounded role profile.

CRITICAL RULES:
1. STRICT SOURCE-OF-TRUTH: Extract ONLY facts, skills, responsibilities, and requirements explicitly mentioned in the JD.
2. DO NOT HALLUCINATE OR INVENT TECHNOLOGIES. If the JD does not explicitly state a tool (e.g. Docker, Kubernetes, AWS, Go, React), DO NOT include it.
3. EXTRACT ALL RESPONSIBILITIES: Do NOT stop at 3. Extract every meaningful responsibility mentioned in the JD.
4. CATEGORIZE TECHNICAL SKILLS: Group every technology/tool/architecture explicitly mentioned into:
   - "Programming Languages" (e.g. Go, TypeScript, Java, Python)
   - "Frameworks & Libraries" (e.g. React, Next.js, Express)
   - "Backend Technologies" (e.g. Node.js, REST APIs, gRPC)
   - "Frontend Technologies" (e.g. HTML5, CSS3, Tailwind CSS)
   - "Databases" (e.g. MongoDB, PostgreSQL, Redis)
   - "Cloud & Infrastructure" (e.g. AWS, Azure, GCP, Docker, Kubernetes)
   - "DevOps & CI/CD" (e.g. GitHub Actions, Jenkins, CI/CD pipelines)
   - "Architecture & Distributed Systems" (e.g. Microservices, Event-Driven, Concurrency, Distributed Systems)
   - "Testing & Quality" (e.g. Unit Testing, Integration Testing, End-to-End Testing)
   - "Security" (e.g. OAuth, Authentication, Authorization)
   - "Developer Tools" (e.g. Git, Linux)
   (Only include categories that have skills explicitly mentioned in the JD. Omit empty categories).
5. Extract Behavioural / Soft Skills explicitly mentioned in the JD (e.g. Mentoring, Technical Leadership, Code Reviews, Cross-Functional Collaboration).
6. Extract Domain Knowledge explicitly mentioned in the JD (e.g. FinTech, High-Throughput Systems, Observability, Telemetry).
7. If any field is not mentioned in the JD, set it to "Not specified in job description" or an empty list.

Output JSON format:
{
  "title": "Exact job title from JD",
  "normalized_title": "Normalized title",
  "seniority": "Junior | Mid-Level | Senior | Staff | Principal | Lead",
  "overview": "Concise summary derived strictly from JD",
  "employment_type": "Full-Time | Contract | Internship | Not specified in job description",
  "work_mode": "Remote | Hybrid | On-Site | Not specified in job description",
  "location": "Location if present or Not specified in job description",
  "department": "Department/Team if present or Not specified in job description",
  "job_family": "Job family e.g. Software Engineering",
  "experience": "Experience range e.g. 5+ years or Not specified in job description",
  "education": ["Education/degree requirements from JD"],
  "certifications": ["Certifications from JD"],
  "responsibilities": ["Every day-to-day responsibility mentioned in JD without artificial limit"],
  "technical_skills": {
    "Programming Languages": ["Skill"],
    "Backend Technologies": ["Skill"]
  },
  "soft_skills": ["Soft skill"],
  "domain_skills": ["Domain skill"],
  "responsibility_skill_map": {
    "Responsibility text": ["Related Skill"]
  },
  "compensation": "Compensation if present or Not specified in job description",
  "benefits": ["Benefits if present in JD"],
  "work_authorization": "Work authorization if present or Not specified in job description"
}
`;

  const { systemPrompt, userPrompt } = buildSafePrompt({
    trustedInstructions,
    untrustedData: {
      company_name: companyName,
      job_description: cleanJd
    }
  });

  let rawRole: RawRoleInfo;
  try {
    rawRole = await llm.generateJson<RawRoleInfo>(
      systemPrompt,
      userPrompt,
      '{"title": "string", "seniority": "string", "responsibilities": ["string"]}'
    );
  } catch {
    rawRole = heuristicExtractRole(cleanJd, companyName);
  }

  if (!rawRole || !rawRole.title || !Array.isArray(rawRole.responsibilities) || rawRole.responsibilities.length === 0) {
    rawRole = heuristicExtractRole(cleanJd, companyName);
  }

  // Ensure responsibility_skill_map exists
  const respSkillMap: Record<string, string[]> = rawRole.responsibility_skill_map || {};
  const allExtractedSkills: string[] = [
    ...Object.values(rawRole.technical_skills || {}).flat(),
    ...(rawRole.soft_skills || []),
    ...(rawRole.domain_skills || [])
  ];

  if (Object.keys(respSkillMap).length === 0 && allExtractedSkills.length > 0) {
    (rawRole.responsibilities || []).forEach(resp => {
      const respLower = resp.toLowerCase();
      const matched = allExtractedSkills.filter(s => respLower.includes(s.toLowerCase()));
      if (matched.length > 0) {
        respSkillMap[resp] = Array.from(new Set(matched));
      }
    });
  }

  // Build requirement_skill_map
  const reqSkillMap: Record<string, string[]> = {};
  requirements.forEach(req => {
    const reqLower = req.text.toLowerCase();
    const matched = allExtractedSkills.filter(s => reqLower.includes(s.toLowerCase()));
    if (matched.length > 0) {
      reqSkillMap[req.id] = Array.from(new Set(matched));
    }
  });

  return {
    title: rawRole.title || 'Software Engineer',
    normalized_title: rawRole.normalized_title || rawRole.title || 'Software Engineer',
    seniority: rawRole.seniority || 'Mid-Level',
    overview: rawRole.overview || (rawRole.responsibilities.length > 0
      ? `Responsible for ${rawRole.responsibilities.slice(0, 2).map(r => r.toLowerCase().replace(/\.$/, '')).join(' and ')}.`
      : 'Responsible for core software engineering deliverables as stated in the job description.'),
    employment_type: rawRole.employment_type || 'Not specified in job description',
    work_mode: rawRole.work_mode || 'Not specified in job description',
    location: rawRole.location || 'Not specified in job description',
    department: rawRole.department || 'Not specified in job description',
    job_family: rawRole.job_family || 'Software Engineering',
    experience: rawRole.experience || 'Not specified in job description',
    education: Array.isArray(rawRole.education) && rawRole.education.length > 0 ? rawRole.education : ['Education requirements not specified in the job description.'],
    certifications: Array.isArray(rawRole.certifications) && rawRole.certifications.length > 0 ? rawRole.certifications : [],
    responsibilities: rawRole.responsibilities,
    technical_skills: rawRole.technical_skills && Object.keys(rawRole.technical_skills).length > 0
      ? rawRole.technical_skills
      : undefined,
    soft_skills: Array.isArray(rawRole.soft_skills) && rawRole.soft_skills.length > 0
      ? rawRole.soft_skills
      : undefined,
    domain_skills: Array.isArray(rawRole.domain_skills) && rawRole.domain_skills.length > 0
      ? rawRole.domain_skills
      : undefined,
    responsibility_skill_map: Object.keys(respSkillMap).length > 0 ? respSkillMap : undefined,
    requirement_skill_map: Object.keys(reqSkillMap).length > 0 ? reqSkillMap : undefined,
    compensation: rawRole.compensation || 'Not specified in job description',
    benefits: Array.isArray(rawRole.benefits) && rawRole.benefits.length > 0 ? rawRole.benefits : [],
    work_authorization: rawRole.work_authorization || 'Not specified in job description',
    requirements
  };
}

/**
 * Intelligent deterministic fallback extractor for role details
 */
export function heuristicExtractRole(jd: string, companyName: string): RawRoleInfo {
  const lines = jd
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  // 1. Title Extraction
  let title = '';
  for (const line of lines.slice(0, 5)) {
    const clean = line.replace(/^[#*-\s]+/, '').trim();
    if (/engineer|developer|architect|lead|manager|specialist|consultant|scientist|analyst/i.test(clean) && clean.length < 70) {
      title = clean;
      break;
    }
  }
  if (!title) {
    title = lines[0] ? lines[0].replace(/^[#*-\s]+/, '').slice(0, 60).trim() : 'Software Engineer';
  }

  // 2. Seniority Extraction
  let seniority = 'Mid-Level';
  const fullText = jd.toLowerCase();
  if (/\b(?:staff|principal|director|fellow)\b/i.test(title + ' ' + fullText.slice(0, 300))) {
    seniority = 'Staff';
  } else if (/\b(?:lead|team lead|tech lead)\b/i.test(title + ' ' + fullText.slice(0, 300))) {
    seniority = 'Lead';
  } else if (/\b(?:senior|sr\.?|iii|iv)\b/i.test(title + ' ' + fullText.slice(0, 300))) {
    seniority = 'Senior';
  } else if (/\b(?:junior|jr\.?|associate|entry|intern|graduate)\b/i.test(title + ' ' + fullText.slice(0, 300))) {
    seniority = 'Junior';
  }

  // 3. Work Mode & Location
  let work_mode = 'Not specified in job description';
  if (/\bremote\b/i.test(fullText)) work_mode = 'Remote';
  else if (/\bhybrid\b/i.test(fullText)) work_mode = 'Hybrid';
  else if (/\bon-?site\b/i.test(fullText)) work_mode = 'On-Site';

  let employment_type = 'Not specified in job description';
  if (/\bfull-?time\b/i.test(fullText)) employment_type = 'Full-Time';
  else if (/\bcontract(?:or)?\b/i.test(fullText)) employment_type = 'Contract';
  else if (/\binternship\b/i.test(fullText)) employment_type = 'Internship';

  // 4. Experience Extraction
  let experience = 'Not specified in job description';
  const expMatch = jd.match(/\b(\d+\+?\s*(?:to\s*\d+\+?)?\s*years?(?:\s+of\s+experience|\s+experience)?)/i);
  if (expMatch) {
    experience = expMatch[1].trim();
  }

  // 5. Education Extraction
  const education: string[] = [];
  const eduMatches = jd.match(/(?:bachelor(?:'s)?|master(?:'s)?|ph\.?d\.?|degree in (?:computer science|engineering|related field)|bs\/ms)/gi);
  if (eduMatches) {
    education.push(...Array.from(new Set(eduMatches.map(e => e.trim()))));
  }

  // 6. Responsibilities Extraction (extract ALL bullets/lines)
  const responsibilities: string[] = [];
  let inRespSection = false;
  let inReqSection = false;

  for (const line of lines) {
    const lLower = line.toLowerCase();
    if (lLower.includes('responsibilit') || lLower.includes('what you\'ll do') || lLower.includes('what you will do') || lLower.includes('duties')) {
      inRespSection = true;
      inReqSection = false;
      continue;
    }
    if (lLower.includes('requirement') || lLower.includes('qualification') || lLower.includes('must have') || lLower.includes('nice to have') || lLower.includes('bonus')) {
      inRespSection = false;
      inReqSection = true;
      continue;
    }

    const isBullet = /^[-*•\d.]+\s+/.test(line);
    const cleanLine = line.replace(/^[-*•\d.]+\s*/, '').trim();

    if (inRespSection && cleanLine.length > 10) {
      responsibilities.push(cleanLine);
    } else if (!inReqSection && isBullet && cleanLine.length > 15 && /design|build|architect|maintain|lead|mentor|develop|collaborat|optimiz|deploy|implement|review/i.test(cleanLine)) {
      responsibilities.push(cleanLine);
    }
  }

  // If none extracted via section markers, extract all action bullet points
  if (responsibilities.length === 0) {
    for (const line of lines) {
      const cleanLine = line.replace(/^[-*•\d.]+\s*/, '').trim();
      if (cleanLine.length > 20 && /^(?:design|build|architect|maintain|lead|mentor|develop|collaborat|optimiz|deploy|implement|review|create|support|ensure)\b/i.test(cleanLine)) {
        responsibilities.push(cleanLine);
      }
    }
  }

  if (responsibilities.length === 0) {
    responsibilities.push('Design, develop, and maintain robust software systems aligned with engineering standards.');
    responsibilities.push('Collaborate with cross-functional team members to deliver technical solutions.');
  }

  // 7. Grounded Technical Skills Extraction (Strict Word Boundary - Zero Hallucination)
  const technical_skills: Record<string, string[]> = {};

  const checkAndAdd = (category: string, skill: string, regex: RegExp) => {
    if (regex.test(jd)) {
      if (!technical_skills[category]) technical_skills[category] = [];
      if (!technical_skills[category].includes(skill)) {
        technical_skills[category].push(skill);
      }
    }
  };

  // Programming Languages
  checkAndAdd('Programming Languages', 'Go', /\b(?:golang|go)\b/i);
  checkAndAdd('Programming Languages', 'TypeScript', /\btypescript\b/i);
  checkAndAdd('Programming Languages', 'JavaScript', /\bjavascript\b/i);
  checkAndAdd('Programming Languages', 'Python', /\bpython\b/i);
  checkAndAdd('Programming Languages', 'Java', /\bjava\b/i);
  checkAndAdd('Programming Languages', 'C++', /\bc\+\+\b/i);
  checkAndAdd('Programming Languages', 'C#', /\bc#\b/i);
  checkAndAdd('Programming Languages', 'Rust', /\brust\b/i);

  // Frameworks & Libraries
  checkAndAdd('Frameworks & Libraries', 'React', /\breact(?:\.js)?\b/i);
  checkAndAdd('Frameworks & Libraries', 'Next.js', /\bnext(?:\.js)?\b/i);
  checkAndAdd('Frameworks & Libraries', 'Express', /\bexpress(?:\.js)?\b/i);
  checkAndAdd('Frameworks & Libraries', 'Vue', /\bvue(?:\.js)?\b/i);
  checkAndAdd('Frameworks & Libraries', 'Angular', /\bangular\b/i);

  // Backend Technologies
  checkAndAdd('Backend Technologies', 'Node.js', /\bnode(?:\.js)?\b/i);
  checkAndAdd('Backend Technologies', 'REST APIs', /\b(?:rest|restful)\s*apis?\b/i);
  checkAndAdd('Backend Technologies', 'gRPC', /\bgrpc\b/i);
  checkAndAdd('Backend Technologies', 'GraphQL', /\bgraphql\b/i);
  checkAndAdd('Backend Technologies', 'Concurrent Services', /\bconcurrent(?:\s+backend)?\s+services?\b/i);

  // Databases
  checkAndAdd('Databases', 'MongoDB', /\bmongodb\b/i);
  checkAndAdd('Databases', 'Redis', /\bredis\b/i);
  checkAndAdd('Databases', 'PostgreSQL', /\bpostgres(?:ql)?\b/i);
  checkAndAdd('Databases', 'MySQL', /\bmysql\b/i);
  checkAndAdd('Databases', 'Cassandra', /\bcassandra\b/i);

  // Cloud & Infrastructure
  checkAndAdd('Cloud & Infrastructure', 'AWS', /\baws\b|\bamazon web services\b/i);
  checkAndAdd('Cloud & Infrastructure', 'Azure', /\bazure\b/i);
  checkAndAdd('Cloud & Infrastructure', 'GCP', /\bgcp\b|\bgoogle cloud\b/i);
  checkAndAdd('Cloud & Infrastructure', 'Docker', /\bdocker\b/i);
  checkAndAdd('Cloud & Infrastructure', 'Kubernetes', /\bkubernetes\b|\bk8s\b/i);

  // DevOps & CI/CD
  checkAndAdd('DevOps & CI/CD', 'GitHub Actions', /\bgithub actions\b/i);
  checkAndAdd('DevOps & CI/CD', 'CI/CD Pipelines', /\bci\s*\/\s*cd\b/i);
  checkAndAdd('DevOps & CI/CD', 'Terraform', /\bterraform\b/i);

  // Architecture & Distributed Systems
  checkAndAdd('Architecture & Distributed Systems', 'Distributed Systems', /\bdistributed\s+systems?\b/i);
  checkAndAdd('Architecture & Distributed Systems', 'Microservices', /\bmicroservices?\b/i);
  checkAndAdd('Architecture & Distributed Systems', 'Concurrency', /\bconcurrency\b|\bconcurrent\b/i);
  checkAndAdd('Architecture & Distributed Systems', 'Event-Driven Architecture', /\bevent-driven\b/i);
  checkAndAdd('Architecture & Distributed Systems', 'Kafka', /\bkafka\b/i);

  // Testing & Quality
  checkAndAdd('Testing & Quality', 'Unit Testing', /\bunit\s+test(?:ing|s)?\b/i);
  checkAndAdd('Testing & Quality', 'Integration Testing', /\bintegration\s+test(?:ing|s)?\b/i);
  checkAndAdd('Testing & Quality', 'Automated Testing', /\bautomated\s+testing\b/i);

  // Security
  checkAndAdd('Security', 'OAuth / Auth', /\b(?:oauth|jwt|authentication|authorization)\b/i);

  // Soft Skills
  const soft_skills: string[] = [];
  if (/\bmentor(?:ing|ship|s)?\b/i.test(jd)) soft_skills.push('Mentorship & Coaching');
  if (/\blead(?:ership|ing)?\b/i.test(jd)) soft_skills.push('Technical Leadership');
  if (/\bcollaborat(?:ion|ive|ing)?\b/i.test(jd)) soft_skills.push('Cross-Functional Collaboration');
  if (/\bcode review(?:s)?\b/i.test(jd)) soft_skills.push('Code Reviews & Design Feedback');
  if (/\bcommunicat(?:ion|ing)?\b/i.test(jd)) soft_skills.push('Technical Communication');
  if (/\bownership\b/i.test(jd)) soft_skills.push('End-to-End Ownership');

  // Domain Skills
  const domain_skills: string[] = [];
  if (/\bfintech|financial technology\b/i.test(jd)) domain_skills.push('Financial Technology');
  if (/\be-?commerce\b/i.test(jd)) domain_skills.push('E-Commerce Systems');
  if (/\bobservability|telemetry|tracing\b/i.test(jd)) domain_skills.push('Telemetry & Observability');
  if (/\bhigh-?reliability|high-?availability\b/i.test(jd)) domain_skills.push('High-Reliability Systems');
  if (/\bhigh-?throughput|low-?latency\b/i.test(jd)) domain_skills.push('High-Throughput / Low-Latency');
  if (/\bdistributed systems\b/i.test(jd)) domain_skills.push('Distributed Systems Architecture');

  // Overview
  let overview = `Focuses on engineering scalable software systems as a ${title}.`;
  if (responsibilities.length > 0) {
    overview = `Responsible for ${responsibilities.slice(0, 2).map(r => r.toLowerCase().replace(/\.$/, '')).join(', and ')}.`;
  }

  return {
    title,
    normalized_title: title,
    seniority,
    overview,
    employment_type,
    work_mode,
    location: 'Not specified in job description',
    department: 'Engineering',
    job_family: 'Software Engineering',
    experience,
    education: education.length > 0 ? education : ['Education requirements not specified in the job description.'],
    certifications: [],
    responsibilities,
    technical_skills: Object.keys(technical_skills).length > 0 ? technical_skills : undefined,
    soft_skills: soft_skills.length > 0 ? soft_skills : undefined,
    domain_skills: domain_skills.length > 0 ? domain_skills : undefined,
    compensation: 'Not specified in job description',
    benefits: [],
    work_authorization: 'Not specified in job description'
  };
}
