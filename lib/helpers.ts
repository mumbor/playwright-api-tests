import { APIRequestContext, APIResponse } from '@playwright/test';

export interface TimedResponse {
  response: APIResponse;
  durationMs: number;
}

export async function timedRequest(
  fn: () => Promise<APIResponse>
): Promise<TimedResponse> {
  const start = Date.now();
  const response = await fn();
  const durationMs = Date.now() - start;
  return { response, durationMs };
}