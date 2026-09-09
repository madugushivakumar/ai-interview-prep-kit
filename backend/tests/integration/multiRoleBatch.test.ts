import { describe, it, expect, vi } from 'vitest';
import { runInterviewPipeline } from '../../src/services/pipeline/interviewPipeline.js';
import { MultiRoleParser } from '../../src/services/batch/multiRoleParser.js';

describe('Multi-Role Batch Processing & Partial Failure Isolation', () => {
  it('should process multiple roles independently and tolerate individual failure without failing other roles', async () => {
    // 3 roles: role-1 (valid), role-2 (unreachable company), role-3 (valid)
    const roles = [
      {
        id: 'role-backend',
        jd: 'Senior Backend Engineer with Node.js, distributed databases, and high availability systems.',
        company_url: 'https://example.com',
        days: 5
      },
      {
        id: 'role-unreachable',
        jd: 'DevOps Engineer with Kubernetes and Terraform experience.',
        company_url: 'https://unreachable-test-domain-404.nonexistent',
        days: 3
      },
      {
        id: 'role-frontend',
        jd: 'Staff Frontend Engineer building modern React and TypeScript web applications.',
        company_url: 'https://example.com',
        days: 7
      }
    ];

    const results: Array<{ id: string; status: 'ok' | 'failed'; kit?: any; error?: any }> = [];

    for (const role of roles) {
      try {
        const kit = await runInterviewPipeline(
          {
            jd: role.jd,
            company_url: role.company_url,
            days: role.days
          },
          {
            allowLocalUrls: true
          }
        );

        results.push({
          id: role.id,
          status: 'ok',
          kit
        });
      } catch (err: any) {
        results.push({
          id: role.id,
          status: 'failed',
          error: {
            code: err.code || 'PIPELINE_ERROR',
            message: err.message
          }
        });
      }
    }

    expect(results).toHaveLength(3);

    // Role 1 (Backend) should succeed
    const r1 = results.find(r => r.id === 'role-backend');
    expect(r1?.status).toBe('ok');
    expect(r1?.kit).toBeDefined();
    expect(r1?.kit.role.title).toBeDefined();
    expect(r1?.kit.schedule.days_available).toBe(5);

    // Role 2 (Unreachable) should fail gracefully with structured error code
    const r2 = results.find(r => r.id === 'role-unreachable');
    expect(r2?.status).toBe('failed');
    expect(r2?.error).toBeDefined();
    expect(r2?.error.code).toMatch(/COMPANY_UNREACHABLE|INVALID_COMPANY_URL|PIPELINE_ERROR/);

    // Role 3 (Frontend) should succeed despite Role 2 failure!
    const r3 = results.find(r => r.id === 'role-frontend');
    expect(r3?.status).toBe('ok');
    expect(r3?.kit).toBeDefined();
    expect(r3?.kit.schedule.days_available).toBe(7);
  });
});
