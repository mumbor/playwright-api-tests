import { test, expect } from '@playwright/test';
import { timedRequest } from '../../lib/helpers';

const THRESHOLDS = {
  fast: 500,
  acceptable: 1000,
  slow: 2000,
};

test.describe('Posts API — performance', () => {

  test('get all posts responds within acceptable time', async ({ request }) => {
    const { response, durationMs } = await timedRequest(() =>
      request.get('/posts')
    );

    console.log(`GET /posts: ${durationMs}ms`);
    expect(response.ok()).toBeTruthy();
    expect(durationMs).toBeLessThan(THRESHOLDS.acceptable);
  });

  test('get a single post responds within fast time', async ({ request }) => {
    const { response, durationMs } = await timedRequest(() =>
      request.get('/posts/1')
    );

    console.log(`GET /posts/1: ${durationMs}ms`);
    expect(response.ok()).toBeTruthy();
    expect(durationMs).toBeLessThan(THRESHOLDS.fast);
  });

  test('create a post responds within acceptable time', async ({ request }) => {
    const { response, durationMs } = await timedRequest(() =>
      request.post('/posts', {
        data: {
          title: 'performance test post',
          body: 'testing response time',
          userId: 1,
        },
      })
    );

    console.log(`POST /posts: ${durationMs}ms`);
    expect(response.ok()).toBeTruthy();
    expect(durationMs).toBeLessThan(THRESHOLDS.acceptable);
  });

  test('response times are consistent across multiple requests', async ({ request }) => {
    const durations: number[] = [];

    for (let i = 0; i < 5; i++) {
      const { durationMs } = await timedRequest(() =>
        request.get('/posts/1')
      );
      durations.push(durationMs);
    }

    const average = durations.reduce((a, b) => a + b, 0) / durations.length;
    const max = Math.max(...durations);

    console.log(`Average: ${average.toFixed(0)}ms, Max: ${max}ms`);
    console.log(`All durations: ${durations.join('ms, ')}ms`);

    expect(average).toBeLessThan(THRESHOLDS.acceptable);
    expect(max).toBeLessThan(THRESHOLDS.slow);
  });

});