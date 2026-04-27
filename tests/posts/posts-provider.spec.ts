import path from 'path';
import { Verifier } from '@pact-foundation/pact';
import { test, expect } from '@playwright/test';

test.describe('Posts API — provider verification', () => {

  test('provider honours the consumer contract', async () => {
    const verifier = new Verifier({
      providerBaseUrl: 'https://jsonplaceholder.typicode.com',
      pactUrls: [
        path.resolve(process.cwd(), 'pacts/PlaywrightTestSuite-PostsAPI.json'),
      ],
      provider: 'PostsAPI',
      logLevel: 'warn',
    });

    await verifier.verifyProvider();

    expect(true).toBe(true);
  });

});