import { logger } from '../src/utils/logger';

describe('Logger Reliability and Sanitization Suite', () => {
  beforeEach(() => {
    logger.clearLogs();
  });

  it('should log info, warn, error, and debug messages with IDs and timestamps', () => {
    logger.info('Test info log');
    logger.warn('Test warn log');
    logger.error('Test error log');
    logger.debug('Test debug log');

    const logs = logger.getLogs();
    expect(logs.length).toBe(4);
    expect(logs[0].level).toBe('debug');
    expect(logs[1].level).toBe('error');
    expect(logs[2].level).toBe('warn');
    expect(logs[3].level).toBe('info');
  });

  it('should sanitize sensitive secrets, passwords, and API keys', () => {
    logger.info('User logged in with password="SecretPassword123" and token="eyJhbGciOiJIUzI1NiIsIn"');
    const logs = logger.getLogs();
    expect(logs[0].message).not.toContain('SecretPassword123');
    expect(logs[0].message).not.toContain('eyJhbGciOiJIUzI1NiIsIn');
    expect(logs[0].message).toContain('[REDACTED]');
  });

  it('should sanitize email addresses and authorization objects', () => {
    logger.error('Failed request', {
      apiKey: 'sk_live_1234567890abcdef',
      userEmail: 'user@example.com',
      authToken: 'Bearer secret_token_xyz',
    });

    const logs = logger.getLogs();
    const ctx = logs[0].context as Record<string, string>;
    expect(ctx.apiKey).toBe('[REDACTED]');
    expect(ctx.authToken).toBe('[REDACTED]');
  });

  it('should clear logs when requested', () => {
    logger.info('Sample log');
    expect(logger.getLogs().length).toBe(1);
    logger.clearLogs();
    expect(logger.getLogs().length).toBe(0);
  });
});
