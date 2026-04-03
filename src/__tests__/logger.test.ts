import { LogLevel } from '../utils/logger';

describe('LogLevel', () => {
  it('has all expected log levels', () => {
    expect(LogLevel.ERROR).toBe('ERROR');
    expect(LogLevel.WARN).toBe('WARN');
    expect(LogLevel.INFO).toBe('INFO');
    expect(LogLevel.DEBUG).toBe('DEBUG');
  });
});
