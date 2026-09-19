import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { projectRoutes } from './modules/projects/projects.routes.js';
import { userRoutes } from './modules/users/users.routes.js';
import { githubRoutes } from './modules/github/github.routes.js';
import { uploadRoutes } from './modules/uploads/uploads.routes.js';
import { errorHandler } from './middlewares/error.js';
import { limiter } from './middlewares/limits.js';
import { AppError } from './utils/errors.js';
export const app = express();
const configuredClient = new URL(env.CLIENT_URL);
const allowedOrigins = new Set([env.CLIENT_URL]);
if (env.NODE_ENV === 'development') {
  const alternateHost =
    configuredClient.hostname === 'localhost' ? '127.0.0.1' : 'localhost';
  const alternate = new URL(env.CLIENT_URL);
  alternate.hostname = alternateHost;
  allowedOrigins.add(alternate.origin);
}
const originAllowed = (origin?: string) =>
  !origin || allowedOrigins.has(origin);
app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      callback(null, originAllowed(origin));
    },
    credentials: true,
  }),
);
app.use(limiter(600));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use((req, _res, next) => {
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
    req.headers.origin &&
    !originAllowed(req.headers.origin)
  )
    throw new AppError(403, 'Request origin is not allowed.');
  next();
});
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/github', githubRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});
app.use(errorHandler);
