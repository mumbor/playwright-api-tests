# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\crud.spec.ts >> Posts API — CRUD flow >> step 2 — created post can be read back
- Location: tests\crud.spec.ts:22:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 101
Received: undefined
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { PostsApi, Post } from '../lib/PostsApi';
  3  | 
  4  | test.describe('Posts API — CRUD flow', () => {
  5  |   let post: Post;
  6  | 
  7  |   test.beforeAll(async ({ request }) => {
  8  |     const api = new PostsApi(request);
  9  |     post = await api.createPost({
  10 |       title: 'CRUD flow test',
  11 |       body: 'This post will be read, updated, and deleted',
  12 |       userId: 1,
  13 |     });
  14 |   });
  15 | 
  16 |   test('step 1 — post was created with correct data', () => {
  17 |     expect(post.id).toBeTruthy();
  18 |     expect(post.title).toBe('CRUD flow test');
  19 |     expect(post.userId).toBe(1);
  20 |   });
  21 | 
  22 |   test('step 2 — created post can be read back', async ({ request }) => {
  23 |     const api = new PostsApi(request);
  24 |     const fetched = await api.getPost(post.id);
  25 | 
  26 |     console.log('ID:', post.id);
  27 |     console.log('fetched:', fetched);
  28 | 
> 29 |     expect(fetched.id).toBe(post.id);
     |                        ^ Error: expect(received).toBe(expected) // Object.is equality
  30 |     expect(fetched.title).toBeTruthy();
  31 |   });
  32 | 
  33 |   test('step 3 — post can be updated', async ({ request }) => {
  34 |     const response = await request.patch(`/posts/${post.id}`, {
  35 |       data: { title: 'Updated title' },
  36 |     });
  37 | 
  38 |     expect(response.ok()).toBeTruthy();
  39 | 
  40 |     const updated = await response.json() as Post;
  41 |     expect(updated.title).toBe('Updated title');
  42 |   });
  43 | 
  44 |   test('step 4 — post can be deleted', async ({ request }) => {
  45 |     const response = await request.delete(`/posts/${post.id}`);
  46 | 
  47 |     expect(response.ok()).toBeTruthy();
  48 |   });
  49 | 
  50 | });
```