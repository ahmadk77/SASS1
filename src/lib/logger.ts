type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  message: string;
  level: LogLevel;
  timestamp: string;
  [key: string]: any;
}

function formatLog(level: LogLevel, message: string, meta?: Record<string, any>): string | LogPayload {
  const timestamp = new Date().toISOString();
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(meta || {})
    });
  }
  const metaStr = meta && Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    console.log(formatLog('info', message, meta));
  },
  warn: (message: string, meta?: Record<string, any>) => {
    console.warn(formatLog('warn', message, meta));
  },
  error: (message: string, error?: any, meta?: Record<string, any>) => {
    const errorMeta = error instanceof Error 
      ? { errorName: error.name, errorMessage: error.message, stack: error.stack, ...(meta || {}) }
      : { error, ...(meta || {}) };
    console.error(formatLog('error', message, errorMeta));
  },
  debug: (message: string, meta?: Record<string, any>) => {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
      console.debug(formatLog('debug', message, meta));
    }
  }
};
