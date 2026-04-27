import { test, expect } from '../../lib/fixtures';

interface ViewerData {
  viewer: {
    login: string;
    name: string;
  };
}

interface UserData {
  user: {
    login: string;
    followers: { totalCount: number };
  };
}

test.describe('GitHub GraphQL API — helper', () => {

  test('query returns typed data', async ({ graphqlApi }) => {
    const result = await graphqlApi.query<ViewerData>(`
      query {
        viewer {
          login
          name
        }
      }
    `);

    expect(graphqlApi.hasErrors(result)).toBe(false);
    expect(result.data.viewer.login).toBeTruthy();
  });

  test('query with variables returns correct user', async ({ graphqlApi }) => {
    const result = await graphqlApi.query<UserData>(
      `
        query GetUser($login: String!) {
          user(login: $login) {
            login
            followers {
              totalCount
            }
          }
        }
      `,
      { login: process.env.GH_USERNAME }
    );

    expect(graphqlApi.hasErrors(result)).toBe(false);
    expect(result.data.user.login).toBe(process.env.GH_USERNAME);
  });

  test('invalid query is detected via hasErrors', async ({ graphqlApi }) => {
    const result = await graphqlApi.query(`
      query {
        invalidField {
          login
        }
      }
    `);

    expect(graphqlApi.hasErrors(result)).toBe(true);
    expect(result.errors![0].message).toBeTruthy();
  });

});