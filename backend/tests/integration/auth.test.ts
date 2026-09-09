import { describe, it, expect, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../src/services/auth/auth.service.js';
import { User } from '../../src/models/User.js';
import { config } from '../../src/config/env.js';

describe('Authentication & User Isolation Service (AuthService)', () => {
  it('should hash passwords securely and generate valid JWT tokens', async () => {
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash('SecurePassword123!', salt);

    expect(await bcrypt.compare('SecurePassword123!', hash)).toBe(true);
    expect(await bcrypt.compare('WrongPassword', hash)).toBe(false);

    // Test JWT token generation and verification
    const mockUser: any = {
      _id: '507f1f77bcf86cd799439011',
      email: 'engineer@example.com'
    };

    const token = AuthService.generateToken(mockUser);
    expect(token).toBeDefined();

    const decoded: any = jwt.verify(token, config.JWT_SECRET);
    expect(decoded.userId).toBe('507f1f77bcf86cd799439011');
    expect(decoded.email).toBe('engineer@example.com');
  });

  it('should reject invalid credentials during login simulation', async () => {
    // Mock User.findOne
    vi.spyOn(User, 'findOne').mockResolvedValue(null as any);

    await expect(
      AuthService.login({
        email: 'nonexistent@example.com',
        password: 'password123'
      })
    ).rejects.toThrow('Invalid email or password.');

    vi.restoreAllMocks();
  });
});
