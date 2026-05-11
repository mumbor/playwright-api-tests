#!/usr/bin/env tsx
/**
 * Self-healing test runner.
 *
 * Flow:
 *   1. Run tests (--retries=0 for clean signal)
 *   2. If all pass → exit 0, nothing to do
 *   3. Send failures + framework file contents to Claude for classification
 *   4. If PRODUCT issue → fail loudly, no changes made
 *   5. If FRAMEWORK issue → validate + apply proposed fixes
 *   6. Rerun tests; if pass → create PR (CI) or show diff (local)
 *   7. If still failing → revert files and exit non-zero
 *
 * Guardrails enforced here (not just in the prompt):
 *   - Only HEALABLE_FILES may be modified
 *   - Total changed lines capped at MAX_DIFF_LINES
 *   - old_content must match exactly once in the file (no ambiguous replacements)
 *   - Minimum confidence threshold before applying any fix
 *   - Maximum one healing attempt per invocation
 */
import Anthropic from '@anthropic-ai/sdk';
import { spawnSync } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(ROOT, '.env.local') });

const IS_CI          = Boolean(process.env.CI);
const RESULTS_FILE   = path.join(ROOT, 'test-results', 'results.json');
const MAX_DIFF_LINES = 20;
const MIN_CONFIDENCE = 85;
const PR_REVIEWER    = 'mumbor';

const HEALABLE_FILES = [
  'playwright.config.ts',
  'lib/fixtures.ts',
  'lib/helpers.ts',
  'lib/PostsApi.ts',
  'lib/GithubApi.ts',
  'lib/GraphqlApi.ts',
] as const;

type HealableFile = typeof HEALABLE_FILES[number];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FileFix {
  file: string;
  description: string;
  old_content: string;
  new_content: string;
}

interface AnalysisResult {
  classification: 'FRAMEWORK' | 'PRODUCT';
  confidence: number;
  reason: string;
  product_issue_details?: string;
  fixes?: FileFix[];
}

// ─── Logging ──────────────────────────────────────────────────────────────────

function log(msg: string): void {
  console.log(msg);
  if (IS_CI && process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, msg + '\n');
  }
}

// ─── Git ─────────────────────────────────────────────────────────────────────

function git(args: string[]): void {
  const r = spawnSync('git', args, { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`git ${args[0]} failed (exit ${r.status})`);
}

// ─── Test runner ─────────────────────────────────────────────────────────────

function runTests(extraFlags: string[] = []): number {
  const r = spawnSync(
    'npx playwright test --project=jsonplaceholder --project=github --retries=0 --reporter=dot --reporter=json ' + extraFlags.join(' '),
    {
      shell: true,
      cwd: ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        // dot reporter: compact (one char per test), json: writes results file
        // PLAYWRIGHT_JSON_OUTPUT_NAME tells the json reporter where to write the file
        // even when --reporter is passed via CLI (which would otherwise override config)
        PLAYWRIGHT_JSON_OUTPUT_NAME: RESULTS_FILE,
      },
    },
  );
  return r.status ?? 1;
}

// ─── Result parsing ───────────────────────────────────────────────────────────

function extractFailures(results: any): string {
  const lines: string[] = [];

  if (results.errors?.length) {
    lines.push('=== SETUP / FRAMEWORK ERRORS ===');
    (results.errors as any[]).forEach(e => lines.push(e.message ?? String(e)));
  }

  function walkSuites(suites: any[]): void {
    for (const suite of suites ?? []) {
      walkSuites(suite.suites ?? []);
      for (const spec of suite.specs ?? []) {
        for (const test of spec.tests ?? []) {
          if (test.status !== 'unexpected') continue;
          for (const r of test.results ?? []) {
            if (r.status !== 'failed') continue;
            lines.push(
              `TEST:    ${spec.title}`,
              `FILE:    ${suite.file ?? '(unknown)'}`,
              `PROJECT: ${test.projectName ?? '(unknown)'}`,
              `ERRORS:  ${(r.errors as any[] ?? []).map((e: any) => e.message).join(' | ') || 'unknown'}`,
              '---',
            );
          }
        }
      }
    }
  }

  walkSuites(results.suites ?? []);
  return lines.join('\n') || 'No failure details extracted.';
}

// ─── File helpers ─────────────────────────────────────────────────────────────

function readHealableFiles(): Record<string, string> {
  return Object.fromEntries(
    HEALABLE_FILES.flatMap(file => {
      const fullPath = path.join(ROOT, file);
      if (!fs.existsSync(fullPath)) return [];
      let content = fs.readFileSync(fullPath, 'utf-8');
      // Redact values in env files — Claude needs structure, not secrets
      if (file.startsWith('.env')) {
        content = content.replace(/=.*/gm, '=<REDACTED>');
      }
      return [[file, content]] as [string, string][];
    }),
  );
}

// ─── Claude analysis ──────────────────────────────────────────────────────────

async function analyzeFailures(
  failures: string,
  fileContents: Record<string, string>,
): Promise<AnalysisResult> {
  const client = new Anthropic();

  const fileBlock = Object.entries(fileContents)
    .map(([f, c]) => `=== ${f} ===\n${c}`)
    .join('\n\n');

  const systemPrompt = `You are a test framework expert analyzing Playwright API test failures.

Classify each failure as FRAMEWORK (healable) or PRODUCT (not healable).

FRAMEWORK issues (test infrastructure problems — you may propose fixes):
- Missing or wrong environment variables / configuration values
- Timeout values too low for the CI environment
- Fixture setup failures unrelated to API behavior
- Import / module resolution errors
- Base URL misconfiguration
- Auth header formatting errors (not token expiry caused by the product)
- Test helper / utility bugs

PRODUCT issues (the API under test is broken — do NOT propose fixes):
- API returning unexpected 4xx / 5xx status codes
- Business logic assertion failures
- Response body or schema mismatches (API changed its contract)
- Performance threshold violations
- Contract test (Pact) failures
- GitHub API rate limiting (external limit, not framework)

STRICT GUARDRAILS you must follow:
1. Only propose changes to these files: ${HEALABLE_FILES.join(', ')}
2. Total lines changed across all fixes must be < ${MAX_DIFF_LINES}
3. Never modify test assertion logic or expected values
4. old_content must be copied verbatim from the file content provided — no paraphrasing
5. Never set any timeout above 60000ms
6. If your confidence is below ${MIN_CONFIDENCE}, classify as PRODUCT (fail safely rather than mis-heal)`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: systemPrompt,
    tools: [
      {
        name: 'report_analysis',
        description: 'Submit the classification result and any proposed framework fixes',
        input_schema: {
          type: 'object' as const,
          properties: {
            classification: {
              type: 'string' as const,
              enum: ['FRAMEWORK', 'PRODUCT'],
              description: 'Whether failures are framework or product issues',
            },
            confidence: {
              type: 'number' as const,
              description: 'Confidence percentage 0–100',
            },
            reason: {
              type: 'string' as const,
              description: 'Concise explanation of the classification',
            },
            product_issue_details: {
              type: 'string' as const,
              description: 'What the product issue is (only when classification=PRODUCT)',
            },
            fixes: {
              type: 'array' as const,
              description: 'File changes to apply (only when classification=FRAMEWORK)',
              items: {
                type: 'object' as const,
                properties: {
                  file: {
                    type: 'string' as const,
                    description: 'Relative path from api-tests root, e.g. playwright.config.ts',
                  },
                  description: {
                    type: 'string' as const,
                    description: 'What this change does and why',
                  },
                  old_content: {
                    type: 'string' as const,
                    description: 'Exact string to replace (must appear exactly once in the file)',
                  },
                  new_content: {
                    type: 'string' as const,
                    description: 'Replacement string',
                  },
                },
                required: ['file', 'description', 'old_content', 'new_content'],
              },
            },
          },
          required: ['classification', 'confidence', 'reason'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'report_analysis' },
    messages: [
      {
        role: 'user',
        content: `Test failures:\n\n${failures}\n\nFramework file contents:\n\n${fileBlock}`,
      },
    ],
  });

  const toolBlock = response.content.find(b => b.type === 'tool_use');
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('Claude did not return a structured analysis');
  }
  return toolBlock.input as AnalysisResult;
}

// ─── Fix validation & application ─────────────────────────────────────────────

function validateFix(fix: FileFix): void {
  if (!HEALABLE_FILES.includes(fix.file as HealableFile)) {
    throw new Error(`Forbidden file: ${fix.file} is not in the allowed list`);
  }
  const content = fs.readFileSync(path.join(ROOT, fix.file), 'utf-8');
  const occurrences = content.split(fix.old_content).length - 1;
  if (occurrences === 0) throw new Error(`old_content not found in ${fix.file}`);
  if (occurrences > 1) throw new Error(`old_content is ambiguous (${occurrences} matches) in ${fix.file}`);
}

function applyFix(fix: FileFix): void {
  const fullPath = path.join(ROOT, fix.file);
  const content  = fs.readFileSync(fullPath, 'utf-8');
  fs.writeFileSync(fullPath, content.replace(fix.old_content, fix.new_content), 'utf-8');
}

function diffLineCount(fixes: FileFix[]): number {
  return fixes.reduce(
    (n, f) => n + f.old_content.split('\n').length + f.new_content.split('\n').length,
    0,
  );
}

// ─── PR creation (CI only) ────────────────────────────────────────────────────

function createPR(analysis: AnalysisResult, fixes: FileFix[]): void {
  const branch = `fix/auto-heal-${Date.now()}`;

  git(['config', 'user.email', 'github-actions[bot]@users.noreply.github.com']);
  git(['config', 'user.name', 'github-actions[bot]']);

  // Allow GITHUB_TOKEN to push
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
    git([
      'remote', 'set-url', 'origin',
      `https://x-access-token:${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_REPOSITORY}.git`,
    ]);
  }

  git(['checkout', '-b', branch]);
  git(['add', ...fixes.map(f => f.file)]);
  git(['commit', '-m', `fix: auto-heal test framework\n\n${analysis.reason}`]);
  git(['push', 'origin', branch]);

  const body = [
    '## Self-Healing Test Fix',
    '',
    `**Reason:** ${analysis.reason}`,
    '',
    '**Changes made:**',
    ...fixes.map(f => `- \`${f.file}\`: ${f.description}`),
    '',
    '**Validation:** All tests passed after applying this fix.',
    '',
    '> Auto-generated by the self-healing workflow. Review carefully before merging.',
  ].join('\n');

  // Write body to a temp file to avoid shell-escaping issues
  const bodyFile = path.join(ROOT, 'test-results', 'pr-body.md');
  fs.mkdirSync(path.dirname(bodyFile), { recursive: true });
  fs.writeFileSync(bodyFile, body, 'utf-8');

  const pr = spawnSync(
    `gh pr create --title "fix: auto-heal test framework" --body-file "${bodyFile}" --base main --reviewer ${PR_REVIEWER}`,
    { shell: true, cwd: ROOT, stdio: 'inherit', env: { ...process.env } },
  );
  if (pr.status !== 0) throw new Error('gh pr create failed');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  log('# Self-Healing Test Analysis\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    log('ERROR: ANTHROPIC_API_KEY is not set. Add it as a GitHub Secret or local env var.');
    process.exit(1);
  }

  // ── 1. Run tests, capture JSON results ──────────────────────────────────────
  log('## Step 1: Running tests to capture failures…\n');
  const initialExit = runTests();

  if (initialExit === 0) {
    log('All tests passed. No healing needed.');
    process.exit(0);
  }

  let failureSummary: string;
  if (fs.existsSync(RESULTS_FILE)) {
    const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
    failureSummary = extractFailures(results);
  } else {
    // JSON file not written — Playwright exited before reporters ran (e.g. config error, missing dep).
    // Treat as a framework issue with exit-code context for Claude to analyse.
    failureSummary = `[FRAMEWORK_SETUP] Playwright exited with code ${initialExit} before writing test results.\nNo test output was produced. This typically indicates a configuration error, missing dependency, or globalSetup failure.`;
  }
  process.stderr.write('\n' + '─'.repeat(60) + '\n');
  process.stderr.write('  HEAL SCRIPT: test run complete, starting analysis…\n');
  process.stderr.write('─'.repeat(60) + '\n\n');

  log(`\nFailures captured:\n\`\`\`\n${failureSummary}\n\`\`\`\n`);

  // ── 2. Classify with Claude ──────────────────────────────────────────────────
  log('## Step 2: Analysing failures with Claude AI…\n');
  let analysis: AnalysisResult;
  try {
    analysis = await analyzeFailures(failureSummary, readHealableFiles());
  } catch (err) {
    log(`ERROR: Claude analysis failed: ${err}`);
    process.exit(1);
  }

  log(`**Classification:** ${analysis.classification} (${analysis.confidence}% confidence)`);
  log(`**Reason:** ${analysis.reason}\n`);

  // ── 3. Confidence gate ───────────────────────────────────────────────────────
  if (analysis.confidence < MIN_CONFIDENCE) {
    log(`Confidence ${analysis.confidence}% is below the ${MIN_CONFIDENCE}% threshold — treating as PRODUCT issue for safety.`);
    analysis.classification = 'PRODUCT';
  }

  if (analysis.classification === 'PRODUCT') {
    log(`## Result: PRODUCT ISSUE DETECTED — no healing applied\n\n${analysis.product_issue_details ?? analysis.reason}`);
    process.exit(1);
  }

  // ── 4. Validate proposed fixes ───────────────────────────────────────────────
  const fixes = analysis.fixes ?? [];

  if (fixes.length === 0) {
    log('ERROR: Framework issue detected but no fixes proposed. Escalating to human review.');
    process.exit(1);
  }

  const totalLines = diffLineCount(fixes);
  if (totalLines > MAX_DIFF_LINES) {
    log(`ERROR: Proposed fix is ${totalLines} lines (limit is ${MAX_DIFF_LINES}). Too large — escalating to human review.`);
    process.exit(1);
  }

  log('\n**Proposed fixes:**');
  for (const fix of fixes) {
    log(`\nFile: \`${fix.file}\``);
    log(`Description: ${fix.description}`);
    log(`old_content (${fix.old_content.length} chars):\n\`\`\`\n${fix.old_content}\n\`\`\``);
    log(`new_content:\n\`\`\`\n${fix.new_content}\n\`\`\``);
  }

  try {
    fixes.forEach(validateFix);
  } catch (err) {
    log(`\nERROR: Fix validation failed: ${err}`);
    // Show what's actually in the file at the relevant section to help diagnose
    for (const fix of fixes) {
      const filePath = path.join(ROOT, fix.file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const found = content.includes(fix.old_content);
        log(`\n  ${fix.file}: old_content found = ${found}`);
        if (!found) {
          const idx = content.indexOf(fix.old_content.trim());
          log(`  (trimmed match at index ${idx})`);
        }
      }
    }
    process.exit(1);
  }

  // Back up originals for in-process revert (no git dependency locally)
  const backups = new Map(
    fixes.map(f => [f.file, fs.readFileSync(path.join(ROOT, f.file), 'utf-8')]),
  );

  // ── 5. Apply fixes ───────────────────────────────────────────────────────────
  log(`## Step 3: Applying ${fixes.length} fix(es)…\n`);
  for (const fix of fixes) {
    applyFix(fix);
    log(`- \`${fix.file}\`: ${fix.description}`);
  }

  // ── 6. Verify ────────────────────────────────────────────────────────────────
  log('\n## Step 4: Verifying fix with test rerun…\n');
  const rerunExit = runTests();

  if (rerunExit !== 0) {
    log('\nERROR: Tests still failing after healing attempt. Reverting changes.');
    backups.forEach((content, file) => fs.writeFileSync(path.join(ROOT, file), content, 'utf-8'));
    process.exit(1);
  }

  log('\nAll tests pass after healing!');

  // ── 7. PR or local diff ──────────────────────────────────────────────────────
  if (IS_CI) {
    log('\n## Step 5: Creating pull request…\n');
    try {
      createPR(analysis, fixes);
    } catch (err) {
      log(`ERROR: Could not create PR: ${err}`);
      process.exit(1);
    }
  } else {
    log('\nLocal mode: changes applied successfully.');
    log('Review with `git diff`, then push a branch and open a PR manually.');
    log('\nChanged files:');
    fixes.forEach(f => log(`  - ${f.file}: ${f.description}`));
  }
}

main().catch(err => {
  console.error('Fatal error in heal script:', err);
  process.exit(1);
});
