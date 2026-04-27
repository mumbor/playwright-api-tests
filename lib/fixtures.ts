import { test as base } from '@playwright/test';
import { PostsApi } from './PostsApi';
import { GithubApi } from './GithubApi';
import { GraphqlApi } from './GraphqlApi';

type ApiFixtures = {
  postsApi: PostsApi;
  githubApi: GithubApi;
  graphqlApi: GraphqlApi;
  authenticatedPostsApi: { api: PostsApi; postId: number };
};

export const test = base.extend<ApiFixtures>({
  postsApi: async ({ request }, use) => {
    await use(new PostsApi(request));
  },

  githubApi: async ({ request }, use) => {
    await use(new GithubApi(request));
  },

  graphqlApi: async ({ request }, use) => {
    await use(new GraphqlApi(request));
  },

  authenticatedPostsApi: async ({ request }, use) => {
    const api = new PostsApi(request);
    // setup — create a test post
    const post = await api.createPost({
      title: 'fixture teardown test post',
      body: 'this will be cleaned up automatically',
      userId: 1,
    });

    await use({ api, postId: post.id });          // hand the api and the created post id to the test
    console.log(`Cleaning up post ${post.id}`);   // teardown — runs after the test finishes, even if it fails
  },
});

export { expect } from '@playwright/test';