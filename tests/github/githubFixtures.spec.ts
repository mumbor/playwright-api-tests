import { test, expect } from '../../lib/fixtures';

test.describe('GitHub API — using fixtures', () => {

  test('githubApi fixture fetches authenticated user', async ({ githubApi }) => {
    const user = await githubApi.getAuthenticatedUser();

    expect(user.login).toBeTruthy();
    expect(user.id).toBeTruthy();
  });

});