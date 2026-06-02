import winston from 'winston';
import { Request, Response, NextFunction } from 'express';

export const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}] ${message}${metaStr}`;
        })
      )
    })
  ]
});

export function logger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, url, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    winstonLogger.info('HTTP request', {
      method,
      url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip,
      sessionId: req.headers['x-session-id'] ?? 'anonymous'
    });
  });

  next();
}
