import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { kitRoutes } from './kit.routes.js';
import { practiceRoutes } from './practice.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/kits', kitRoutes);
apiRouter.use('/practice', practiceRoutes);

// Health check endpoint
apiRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export { apiRouter };
