import { describe, it, expect } from 'vitest';
import { MultiRoleParser } from '../../src/services/batch/multiRoleParser.js';

describe('MultiRoleParser Service (JSON & CSV)', () => {
  it('should parse a valid multi-role JSON file', () => {
    const jsonContent = JSON.stringify([
      {
        id: 'role-backend',
        jd: 'Senior Backend Engineer with 5+ years of Node.js, distributed databases, and high-throughput systems.',
        company_url: 'https://example.com/careers',
        days: 5
      },
      {
        id: 'role-frontend',
        jd: 'Staff Frontend Architect with deep expertise in React, Next.js, and browser performance optimization.',
        company_url: 'https://stripe.com/jobs',
        days: 14
      }
    ]);

    const result = MultiRoleParser.parse(jsonContent, { format: 'json' });
    expect(result.success).toBe(true);
    expect(result.roles).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(result.roles[0].id).toBe('role-backend');
    expect(result.roles[1].days).toBe(14);
  });

  it('should parse a valid multi-role CSV file with quoted multiline JDs', () => {
    const csvContent = `id,company_url,days,jd
role-1,https://example.com,7,"Build scalable microservices in Go and Kubernetes.
Must have experience with Kafka and gRPC."
role-2,https://github.com,10,"Front-end engineer building modern React applications."
`;

    const result = MultiRoleParser.parse(csvContent, { format: 'csv' });
    expect(result.success).toBe(true);
    expect(result.roles).toHaveLength(2);
    expect(result.roles[0].id).toBe('role-1');
    expect(result.roles[0].days).toBe(7);
    expect(result.roles[0].jd).toContain('Kafka and gRPC');
  });

  it('should reject malformed JSON with descriptive row error', () => {
    const badJson = '[\n  { "id": "r1", "company_url": "https://example.com" missing quote\n]';
    const result = MultiRoleParser.parse(badJson, { format: 'json' });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('Malformed JSON');
  });

  it('should reject malformed CSV missing required headers', () => {
    const badCsv = `name,location,salary\nAlice,Remote,150000`;
    const result = MultiRoleParser.parse(badCsv, { format: 'csv' });
    expect(result.success).toBe(false);
    expect(result.errors[0].error).toContain('missing required columns');
  });

  it('should perform row-level validation for missing JD and invalid URL', () => {
    const jsonWithRowErrors = JSON.stringify([
      {
        id: 'valid-role',
        jd: 'Full-stack software developer with TypeScript and React experience.',
        company_url: 'https://example.com',
        days: 5
      },
      {
        id: 'bad-url',
        jd: 'DevOps engineer with Terraform and AWS expertise.',
        company_url: 'not-a-url',
        days: 5
      },
      {
        id: 'too-short-jd',
        jd: 'Tiny JD',
        company_url: 'https://valid.org',
        days: 5
      },
      {
        id: 'invalid-days',
        jd: 'Data engineer with Python, Spark, and Snowflake experience.',
        company_url: 'https://valid.org',
        days: 99
      }
    ]);

    const result = MultiRoleParser.parse(jsonWithRowErrors);
    expect(result.success).toBe(true); // Has 1 valid role
    expect(result.roles).toHaveLength(1);
    expect(result.errors).toHaveLength(3);
    expect(result.errors.find(e => e.id === 'bad-url')?.error).toContain('company_url');
    expect(result.errors.find(e => e.id === 'too-short-jd')?.error).toContain('Job description must be at least 10');
    expect(result.errors.find(e => e.id === 'invalid-days')?.error).toContain('Days cannot exceed 60');
  });

  it('should detect duplicate IDs and assign unique IDs with warnings', () => {
    const duplicateIds = JSON.stringify([
      {
        id: 'duplicate-id',
        jd: 'Machine Learning engineer working with PyTorch and transformers.',
        company_url: 'https://example.com',
        days: 5
      },
      {
        id: 'duplicate-id',
        jd: 'Mobile engineer building iOS and Android applications with Flutter.',
        company_url: 'https://example.org',
        days: 3
      }
    ]);

    const result = MultiRoleParser.parse(duplicateIds);
    expect(result.success).toBe(true);
    expect(result.roles).toHaveLength(2);
    expect(result.roles[0].id).toBe('duplicate-id');
    expect(result.roles[1].id).toBe('duplicate-id-2');
    expect(result.warnings.some(w => w.includes('Duplicate ID'))).toBe(true);
  });

  it('should reject empty files', () => {
    const result = MultiRoleParser.parse('   ');
    expect(result.success).toBe(false);
    expect(result.errors[0].error).toContain('empty');
  });

  it('should reject oversized files exceeding byte limit', () => {
    const hugeBuffer = Buffer.alloc(100);
    const result = MultiRoleParser.parse(hugeBuffer, { maxSizeBytes: 50 });
    expect(result.success).toBe(false);
    expect(result.errors[0].error).toContain('exceeds maximum allowed size');
  });
});
