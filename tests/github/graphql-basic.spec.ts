import { test, expect } from '@playwright/test';

test.describe('GitHub GraphQL API', () => {

  test('fetch authenticated viewer login', async ({ request }) => {
    const response = await request.post('/graphql', {
      data: {
        query: `
          query {
            viewer {
              login
              name
              publicRepos: repositories(privacy: PUBLIC) {
                totalCount
              }
            }
          }
        `,
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.errors).toBeUndefined();
    expect(body.data.viewer.login).toBeTruthy();
    expect(body.data.viewer.publicRepos.totalCount).toBeGreaterThanOrEqual(0);
    console.log(`Viewer: ${body.data.viewer.login}`);
  });

  test('invalid query returns errors array', async ({ request }) => {
    const response = await request.post('/graphql', {
      data: {
        query: `
          query {
            thisFieldDoesNotExist {
              login
            }
          }
        `,
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.errors).toBeDefined();
    expect(body.errors.length).toBeGreaterThan(0);
  });

  test('fetch a specific user by login using variables', async ({ request }) => {
    const response = await request.post('/graphql', {
      data: {
        query: `
          query GetUser($login: String!) {
            user(login: $login) {
              login
              name
              followers {
                totalCount
              }
            }
          }
        `,
        variables: {
          login: process.env.GH_USERNAME,
        },
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.errors).toBeUndefined();
    expect(body.data.user.login).toBe(process.env.GH_USERNAME);
  });

});