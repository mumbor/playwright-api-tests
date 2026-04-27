import { test, expect } from '../lib/fixtures';
import { createPostData } from '../lib/factories';

test.describe('Posts API — using fixtures', () => {

  test('postsApi fixture fetches all posts', async ({ postsApi }) => {
    const posts = await postsApi.getAllPosts();

    expect(posts).toHaveLength(100);
    expect(posts[0].id).toBeDefined();
  });

  test('postsApi fixture creates a post', async ({ postsApi }) => {
    const data = createPostData();
    const post = await postsApi.createPost(data);

    expect(post.title).toBe(data.title);
    expect(post.id).toBeTruthy();
  });

  test('authenticatedPostsApi fixture provides setup data', async ({ authenticatedPostsApi }) => {
    const { api, postId } = authenticatedPostsApi;

    expect(postId).toBeTruthy();

    const post = await api.getPost(1);
    expect(post.id).toBe(1);
  });

});