import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../../models/User.js';
import { config } from '../../config/env.js';
import { RegisterInput, LoginInput } from '../../schemas/auth.schema.js';
import { JwtPayload } from '../../types/auth.js';

export class AuthService {
  public static async register(input: RegisterInput): Promise<{ user: IUser; token: string }> {
    const existing = await User.findOne({ email: input.email.toLowerCase().trim() });
    if (existing) {
      const err: any = new Error('An account with this email already exists.');
      err.code = 'EMAIL_ALREADY_EXISTS';
      err.statusCode = 409;
      throw err;
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await User.create({
      email: input.email.toLowerCase().trim(),
      passwordHash
    });

    const token = this.generateToken(user);
    return { user, token };
  }

  public static async login(input: LoginInput): Promise<{ user: IUser; token: string }> {
    const user = await User.findOne({ email: input.email.toLowerCase().trim() });
    if (!user) {
      const err: any = new Error('Invalid email or password.');
      err.code = 'INVALID_CREDENTIALS';
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      const err: any = new Error('Invalid email or password.');
      err.code = 'INVALID_CREDENTIALS';
      err.statusCode = 401;
      throw err;
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  public static generateToken(user: IUser): string {
    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email
    };

    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: `${config.SESSION_MAX_AGE_DAYS || 7}d`
    });
  }

  public static getCookieOptions() {
    return {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: (config.SESSION_MAX_AGE_DAYS || 7) * 24 * 60 * 60 * 1000
    };
  }
}
