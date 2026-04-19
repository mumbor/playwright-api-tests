import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  workers: 4,
  retries: 1,
  reporter: 'html',
  use: {
    baseURL: 'https://api.github.com',
    extraHTTPHeaders: {
      'Authorization': `Bearer ${process.env.GH_API_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  },
  projects: [
    {
      name: 'jsonplaceholder',
      use: {
        baseURL: 'https://jsonplaceholder.typicode.com',
        extraHTTPHeaders: {},
      },
      testMatch: ['**/posts*.spec.ts', '**/crud.spec.ts'],
    },
    {
      name: 'github',
      use: {
        baseURL: 'https://api.github.com',
        extraHTTPHeaders: {
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
      testMatch: ['**/github.spec.ts'],
    },
  ],
});