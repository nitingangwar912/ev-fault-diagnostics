import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { chatRouter } from './routes/chat';
import { logger, winstonLogger } from './middleware/logger';
import { globalLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Session-Id']
}));
app.use(express.json({ limit: '10kb' }));
app.use(globalLimiter);
app.use(logger);

app.use('/api/chat', chatRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  winstonLogger.info(`EV Diagnostics backend running`, {
    port: PORT,
    mode: process.env.DEMO_MODE === 'true' ? 'demo' : 'production'
  });
});
