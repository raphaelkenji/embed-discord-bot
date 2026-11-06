import { RegexTimeoutError, runRegexReplacements } from '../utils/regexWorker';

it('supports captures and returns null for unmatched inputs', async () => {
  await expect(runRegexReplacements(['https://x.com/123', 'hello'], [
    { regex: 'https://x\\.com/(\\d+)', replacement_url: 'https://replacement.example/$1' },
  ], 2000)).resolves.toEqual(['https://replacement.example/123', null]);
});

it('rejects invalid patterns without crashing the caller', async () => {
  await expect(runRegexReplacements(['text'], [{ regex: '[', replacement_url: '' }], 2000))
    .rejects.toThrow('Invalid regular expression');
});

it('terminates catastrophic backtracking while the event loop stays responsive', async () => {
  let responsive = false;
  const timer = setTimeout(() => { responsive = true; }, 10);
  try {
    await expect(runRegexReplacements(['a'.repeat(5000) + '!'], [
      { regex: '^(a+)+$', replacement_url: '' },
    ], 300)).rejects.toBeInstanceOf(RegexTimeoutError);
    expect(responsive).toBe(true);
    await expect(runRegexReplacements(['hello'], [{ regex: 'hello', replacement_url: 'ok' }], 2000))
      .resolves.toEqual(['ok']);
  } finally {
    clearTimeout(timer);
  }
});
