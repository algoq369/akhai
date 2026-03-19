import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Structured logger for new code paths.
 * Existing code uses lib/logger.ts (in-memory log system).
 * New code should use this module for production-grade structured logging.
 *
 * Usage:
 *   import { createStructuredLogger } from '@/lib/structured-logger'
 *   const log = createStructuredLogger('auth')
 *   log.info('User logged in', { userId: '123' })
 */
export const structuredLogger = pino({
  level: isDev ? 'debug' : 'info',
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'apiKey',
      'secret',
    ],
    censor: '[REDACTED]',
  },
});

export function createStructuredLogger(module: string) {
  return structuredLogger.child({ module });
}

export default structuredLogger;
