import { LogEntry } from '../types';

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 200;

  // Sensitive patterns to sanitize
  private sensitivePatterns = [
    /(password|passwd|pwd)\s*[:=]\s*["']?([^"'\s&]+)["']?/gi,
    /(token|bearer|jwt|auth)\s*[:=]\s*["']?([^"'\s&]+)["']?/gi,
    /(api[_-]?key|secret|client[_-]?secret|youtube[_-]?api[_-]?key)\s*[:=]\s*["']?([^"'\s&]+)["']?/gi,
    /(AIzaSy[A-Za-z0-9_-]{33})/gi,
    /([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/gi, // Emails
  ];

  public sanitize(input: unknown): unknown {
    if (typeof input === 'string') {
      let sanitized = input;
      for (const pattern of this.sensitivePatterns) {
        sanitized = sanitized.replace(pattern, '$1=[REDACTED]');
      }
      return sanitized;
    }
    if (typeof input === 'object' && input !== null) {
      if (Array.isArray(input)) {
        return input.map((item) => this.sanitize(item));
      }
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('pass') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('token') ||
          lowerKey.includes('auth') ||
          lowerKey.includes('key')
        ) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = this.sanitize(value);
        }
      }
      return result;
    }
    return input;
  }

  private addLog(level: LogEntry['level'], message: string, context?: Record<string, unknown>) {
    const sanitizedMsg = String(this.sanitize(message));
    const sanitizedContext = context ? (this.sanitize(context) as Record<string, unknown>) : undefined;

    const entry: LogEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      level,
      message: sanitizedMsg,
      context: sanitizedContext,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    if (__DEV__) {
      const prefix = `[YOUR-MUSIC][${level.toUpperCase()}][${entry.timestamp}]`;
      if (level === 'error') {
        console.error(prefix, sanitizedMsg, sanitizedContext || '');
      } else if (level === 'warn') {
        console.warn(prefix, sanitizedMsg, sanitizedContext || '');
      } else {
        console.log(prefix, sanitizedMsg, sanitizedContext || '');
      }
    }
  }

  public info(message: string, context?: Record<string, unknown>) {
    this.addLog('info', message, context);
  }

  public warn(message: string, context?: Record<string, unknown>) {
    this.addLog('warn', message, context);
  }

  public error(message: string, context?: Record<string, unknown>) {
    this.addLog('error', message, context);
  }

  public debug(message: string, context?: Record<string, unknown>) {
    this.addLog('debug', message, context);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();
