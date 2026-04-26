import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { PostsApi } from '../lib/PostsApi';
import { createPostData } from '../lib/factories';

test.describe('Posts API — factory and parameterised tests', () => {

  test('create a post using the factory', async ({ request }) => {
    const api = new PostsApi(request);
    const data = createPostData();
    const post = await api.createPost(data);

    expect(post.title).toBe(data.title);
    expect(post.body).toBe(data.body);
    expect(post.userId).toBe(data.userId);
    expect(post.id).toBeTruthy();
  });

  test('factory override pins a specific userId', async ({ request }) => {
    const api = new PostsApi(request);
    const data = createPostData({ userId: 1 });
    const post = await api.createPost(data);

    expect(post.userId).toBe(1);
  });


  faker.seed(42);

  const testCases = [1, 2, 3, 4, 5].map(i => ({
    index: i,
    body: faker.lorem.paragraph(),
    userId: faker.number.int({ min: 1, max: 10 }),
  }));

  for (const data of testCases) {
    test(`creates post number ${data.index}`, async ({ request }) => {
      const api = new PostsApi(request);
      const postData = { title: `Post ${data.index}`, body: data.body, userId: data.userId };
      const post = await api.createPost(postData);

      expect(post.title).toBe(postData.title);
      expect(post.userId).toBe(data.userId);
      expect(post.id).toBeTruthy();
    });
  }

});