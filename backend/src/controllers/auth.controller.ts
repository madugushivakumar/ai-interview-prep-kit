import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth/auth.service.js';
import { AUTH_COOKIE_NAME } from '../middleware/auth.js';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, token } = await AuthService.register(req.body);

      res.cookie(AUTH_COOKIE_NAME, token, AuthService.getCookieOptions());

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id.toString(),
            email: user.email,
            createdAt: user.createdAt
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, token } = await AuthService.login(req.body);

      res.cookie(AUTH_COOKIE_NAME, token, AuthService.getCookieOptions());

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id.toString(),
            email: user.email,
            createdAt: user.createdAt
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax'
    });

    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully.' }
    });
  }

  public static async getMe(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          createdAt: user.createdAt
        }
      }
    });
  }
}
