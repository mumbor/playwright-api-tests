import path from 'path';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { test, expect } from '@playwright/test';

const { like, integer, string, eachLike } = MatchersV3;

const provider = new PactV3({
  consumer: 'PlaywrightTestSuite',
  provider: 'PostsAPI',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'warn',
});

test.describe('Posts API — contract', () => {

  test('get a single post', async () => {
    await provider
      .given('a post with id 1 exists')
      .uponReceiving('a request for post 1')
      .withRequest({
        method: 'GET',
        path: '/posts/1',
      })
      .willRespondWith({
        status: 200,
        body: like({
          id: integer(1),
          title: string('sample title'),
          body: string('sample body'),
          userId: integer(1),
        }),
      })
      .executeTest(async (mockServer) => {
        const { APIRequestContext, request } = await import('@playwright/test');
        const fetch = (await import('node-fetch')).default;

        const response = await fetch(`${mockServer.url}/posts/1`);
        const post = await response.json() as any;

        expect(post.id).toBeDefined();
        expect(post.title).toBeDefined();
        expect(post.userId).toBeDefined();
      });
  });

  test('get all posts', async () => {
    await provider
      .given('posts exist')
      .uponReceiving('a request for all posts')
      .withRequest({
        method: 'GET',
        path: '/posts',
      })
      .willRespondWith({
        status: 200,
        body: eachLike({
          id: integer(1),
          title: string('sample title'),
          body: string('sample body'),
          userId: integer(1),
        }),
      })
      .executeTest(async (mockServer) => {
        const fetch = (await import('node-fetch')).default;

        const response = await fetch(`${mockServer.url}/posts`);
        const posts = await response.json() as any[];

        expect(Array.isArray(posts)).toBe(true);
        expect(posts[0].id).toBeDefined();
        expect(posts[0].title).toBeDefined();
      });
  });

});