import { test, expect } from '@playwright/test';

interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

test.describe('Posts API', () => {

  test('get all posts', async ({ request }) => {
    const response = await request.get('/posts');

    expect(response.status()).toBe(200);

    const body = await response.json() as Post[];
    expect(body).toHaveLength(100);
    expect(body[0].id).toBeDefined();
    expect(body[0].title).toBeDefined();
  });

  test('get a single post', async ({ request }) => {
    const response = await request.get('/posts/1');

    expect(response.ok()).toBeTruthy();

    const body = await response.json() as Post;
    expect(body.id).toBe(1);
    expect(body.title).toBeTruthy();
  });
  
  test('create a post', async ({ request }) => {
    const response = await request.post('/posts', {
      data: {
        title: 'My test post',
        body: 'Some content here',
        userId: 1,
      },
    });

    expect(response.status()).toBe(201);

    const body = await response.json() as Post;
    expect(body.title).toBe('My test post');
    expect(body.userId).toBe(1);
    expect(body.id).toBeTruthy();
  });
});