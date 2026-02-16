type LogLevel = 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

const serializeContext = (context: LogContext): LogContext => {
  const serialized: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    if (value instanceof Error) {
      serialized[key] = {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
      continue;
    }

    serialized[key] = value;
  }

  return serialized;
};

const writeLog = (level: LogLevel, event: string, context: LogContext = {}) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...serializeContext(context),
  };

  console[level](JSON.stringify(payload));
};

export const apiLogger = {
  info: (event: string, context?: LogContext) => writeLog('info', event, context),
  warn: (event: string, context?: LogContext) => writeLog('warn', event, context),
  error: (event: string, context?: LogContext) => writeLog('error', event, context),
};

