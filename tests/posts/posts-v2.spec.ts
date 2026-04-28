import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { PostsApi, Post } from '../../lib/PostsApi';

test.describe('Posts API', () => {

  test.describe('list and fetch', () => {

    test('get all posts returns 100 items', async ({ request }) => {
      const api = new PostsApi(request);
      const posts = await api.getAllPosts();

      expect(posts).toHaveLength(100);
      expect(posts[0].id).toBeDefined();
    });

    test('get a single post by id', async ({ request }) => {
      const api = new PostsApi(request);
      const post = await api.getPost(1);

      expect(post.id).toBe(1);
      expect(post.title).toBeTruthy();
    });

  });

  test.describe('create and read back', () => {
    let createdPost: Post;

    const postData = {
      title: faker.lorem.sentence(),
      body: faker.lorem.paragraph(),
      userId: faker.number.int({ min: 1, max: 10 }),
    };

    test.beforeAll(async ({ request }) => {
      const api = new PostsApi(request);
      createdPost = await api.createPost(postData);
    });

    test('created post has an id', () => {
      expect(createdPost.id).toBeTruthy();
    });

    test('created post title matches input', () => {
      expect(createdPost.title).toBe(postData.title);
    });

    test('created post userId matches input', () => {
      expect(createdPost.userId).toBe(postData.userId);
    });

  });

  test.describe('filter by user', () => {

    test('all returned posts belong to the requested user', async ({ request }) => {
      const api = new PostsApi(request);
      const posts = await api.getPostsByUser(1);

      expect(posts.length).toBeGreaterThan(0);
      posts.forEach(post => expect(post.userId).toBe(1));
    });

  });

  test('returns 404 for a post that does not exist', async ({ request }) => {
    const api = new PostsApi(request);
    const result = await api.getPostSafe(99999);

    expect(result.status).toBe(404);
    expect(result.success).toBe(false);
  });

});