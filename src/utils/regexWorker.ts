import { Worker } from 'worker_threads';

interface RegexRule {
  regex: string;
  replacement_url: string;
}

export class RegexTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Regex processing exceeded ${timeoutMs}ms`);
    this.name = 'RegexTimeoutError';
  }
}

const workerSource = `
  const { parentPort, workerData } = require('worker_threads');
  try {
    const rules = workerData.rules.map(rule => ({
      regex: new RegExp(rule.regex), replacement: rule.replacement_url
    }));
    const results = workerData.inputs.map(content => {
      for (const rule of rules) {
        const result = content.replace(rule.regex, rule.replacement);
        if (result !== content) return result;
      }
      return null;
    });
    parentPort.postMessage({ results });
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  }
`;

let activeWorkers = 0;

export async function runRegexReplacements(inputs: string[], rules: RegexRule[], timeoutMs: number): Promise<(string | null)[]> {
  if (!inputs.length || !rules.length) return inputs.map(() => null);
  if (activeWorkers >= 4) throw new Error('Regex worker capacity exceeded; try again later');
  activeWorkers += 1;
  let worker: Worker | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await new Promise<(string | null)[]>((resolve, reject) => {
      worker = new Worker(workerSource, {
        eval: true,
        workerData: { inputs, rules },
        resourceLimits: { maxOldGenerationSizeMb: 32, maxYoungGenerationSizeMb: 8 },
      });
      timer = setTimeout(() => reject(new RegexTimeoutError(timeoutMs)), timeoutMs);
      worker.once('message', (message: { results: (string | null)[]; error?: string }) => {
        if (message.error) reject(new Error(message.error));
        else resolve(message.results);
      });
      worker.once('error', reject);
      worker.once('exit', code => reject(new Error(`Regex worker exited before completing (code ${code})`)));
    });
  } finally {
    if (timer) clearTimeout(timer);
    try {
      if (worker) await worker.terminate();
    } finally {
      activeWorkers -= 1;
    }
  }
}
