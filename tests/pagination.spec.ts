import { test, expect } from '@playwright/test';
import { GithubApi } from '../lib/GithubApi';

test.describe('GitHub API — pagination', () => {

  test('page 1 returns the requested number of results', async ({ request }) => {
    const api = new GithubApi(request);
    const repos = await api.getRepoPage(1, 5);

    expect(repos.length).toBeLessThanOrEqual(5);
  });

  test('page 1 and page 2 return different results', async ({ request }) => {
    const api = new GithubApi(request);
    const page1 = await api.getRepoPage(1, 5);
    const page2 = await api.getRepoPage(2, 5);

    if (page1.length === 5 && page2.length > 0) {
      expect(page1[0].id).not.toBe(page2[0].id);
    } else {
      test.skip();
    }
  });

  test('getAllRepos returns all repos across all pages', async ({ request }) => {
    const api = new GithubApi(request);
    const allRepos = await api.getAllRepos();

    expect(allRepos.length).toBeGreaterThan(0);
    allRepos.forEach(repo => {
      expect(repo.id).toBeTruthy();
      expect(repo.name).toBeTruthy();
    });
  });

  test('repo ids are unique across pages', async ({ request }) => {
    const api = new GithubApi(request);
    const allRepos = await api.getAllRepos();
    const ids = allRepos.map(r => r.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

});