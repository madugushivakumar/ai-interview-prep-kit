import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.js';
import { RegisterSchema, LoginSchema } from '../schemas/auth.schema.js';
import { requireAuth } from '../middleware/auth.js';

import { authRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', authRateLimiter, validateBody(RegisterSchema), AuthController.register);
router.post('/login', authRateLimiter, validateBody(LoginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', requireAuth, AuthController.getMe);

export const authRoutes = router;
