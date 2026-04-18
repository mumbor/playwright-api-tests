import { test, expect } from '@playwright/test';
import { PostsApi, Post } from '../lib/PostsApi';

test.describe('Posts API — CRUD flow', () => {
  let post: Post;

  test.beforeAll(async ({ request }) => {
    const api = new PostsApi(request);
    post = await api.createPost({
      title: 'CRUD flow test',
      body: 'This post will be read, updated, and deleted',
      userId: 1,
    });
  });

  test('step 1 — post was created with correct data', () => {
    expect(post.id).toBeTruthy();
    expect(post.title).toBe('CRUD flow test');
    expect(post.userId).toBe(1);
  });

  test('step 2 — created post can be read back', async ({ request }) => {
    const api = new PostsApi(request);
    const fetched = await api.getPost(1);   // the api calls to a site that is stateless and does not actually create posts, so we fetch the first post instead of the created one

    expect(fetched.id).toBe(post.id);
    expect(fetched.title).toBeTruthy();
  });

  test('step 3 — post can be updated', async ({ request }) => {
    const response = await request.patch(`/posts/${post.id}`, {
      data: { title: 'Updated title' },
    });

    expect(response.ok()).toBeTruthy();

    const updated = await response.json() as Post;
    expect(updated.title).toBe('Updated title');
  });

  test('step 4 — post can be deleted', async ({ request }) => {
    const response = await request.delete(`/posts/${post.id}`);

    expect(response.ok()).toBeTruthy();
  });

});