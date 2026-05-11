import { request, type FullConfig } from '@playwright/test';

/**
 * Runs before any tests. Validates connectivity to the base URL.
 * Errors thrown here appear in the JSON report's top-level `errors` array
 * with the [FRAMEWORK_SETUP] prefix, which the heal script uses to
 * distinguish infrastructure failures from test assertion failures.
 */
async function globalSetup(_config: FullConfig): Promise<void> {
  const baseUrl = process.env.BASE_URL ?? 'https://jsonplaceholder.typicode.com';

  const ctx = await request.newContext({ baseURL: baseUrl });
  try {
    const res = await ctx.get('/posts/1', { timeout: 10_000 });
    if (!res.ok()) {
      throw new Error(
        `[FRAMEWORK_SETUP] Base URL health check failed: ${baseUrl} returned HTTP ${res.status()}`,
      );
    }
    console.log(`[globalSetup] Base URL reachable: ${baseUrl}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('[FRAMEWORK_SETUP]')) throw err;
    throw new Error(`[FRAMEWORK_SETUP] Cannot reach base URL ${baseUrl}: ${msg}`);
  } finally {
    await ctx.dispose();
  }

  if (!process.env.GH_API_TOKEN) {
    console.warn('[globalSetup] WARNING: GH_API_TOKEN is not set — GitHub API tests will fail auth');
  }
}

export default globalSetup;
