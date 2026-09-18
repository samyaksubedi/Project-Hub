import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';

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
app.use(express.json({ limit: '100kb' }));

app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});
