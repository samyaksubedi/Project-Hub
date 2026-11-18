import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
await prisma.$connect();
const server = app.listen(env.PORT, env.HOST, () =>
  console.log(`ProjectHub API: http://localhost:${env.PORT}/api/v1`),
);
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    server.close(() => {
      void prisma.$disconnect().then(() => process.exit(0));
    });
  });
