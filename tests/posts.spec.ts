import {test, expect} from '@playwright/test';

interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

test.describe('create and read back', () => {
    let createdId: number;

    test.beforeAll(async ({ request }) => {
      const response = await request.post('/posts', {
        data: {
          title: 'beforeAll test post',
          body: 'Created once, used by all tests below',
          userId: 1,
        },
      });

      const post = await response.json() as Post;
      createdId = post.id;
    });

    test('created post has an id', () => {
      expect(createdId).toBeTruthy();
    });

    test('created post id is a number', () => {
      expect(typeof createdId).toBe('number');
    });

    test('returns 404 for a post that does not exist', async ({ request }) => {
        const response = await request.get('/posts/9999');
        expect(response.status()).toBe(404);
    });

    test('get posts for a vallid user', async ({ request }) => {
        const response = await request.get('/posts?userId=1');
        const posts = await response.json() as Post[];

        expect(response.ok()).toBeTruthy();
        expect(posts.length).toBeGreaterThan(0);
        posts.forEach(post => expect(post.userId).toBe(1));
    });
});