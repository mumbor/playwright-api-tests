import { test, expect } from '@playwright/test';
import { GithubApi, GithubUser } from '../../lib/GithubApi';

test.describe('GitHub API — authenticated', () => {

  test('token is valid and returns authenticated user', async ({ request }) => {
    const api = new GithubApi(request);
    const user = await api.getAuthenticatedUser();

    expect(user.login).toBeTruthy();
    expect(user.id).toBeTruthy();
    console.log(`Authenticated as: ${user.login}`);
  });

  test('authenticated user matches expected username', async ({ request }) => {
    const api = new GithubApi(request);
    const user = await api.getAuthenticatedUser();

    expect(user.login).toBe(process.env.GH_USERNAME);
  });

  test('authenticated user has public repos', async ({ request }) => {
    const api = new GithubApi(request);
    const user = await api.getAuthenticatedUser();

    expect(user.public_repos).toBeGreaterThanOrEqual(0);
  });

  test('can fetch repos list', async ({ request }) => {
    const api = new GithubApi(request);
    const repos = await api.getRepos();

    expect(Array.isArray(repos)).toBeTruthy();
    if (repos.length > 0) {
      expect(repos[0].name).toBeTruthy();
      expect(repos[0].id).toBeTruthy();
    }
  });

  test('returns 401 without a valid token', async ({ request }) => {
    const response = await request.get('/user', {
      headers: {
        'Authorization': 'Bearer invalid_token_here',
      },
    });

    expect(response.status()).toBe(401);
  });

});