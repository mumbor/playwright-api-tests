import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

const env = process.env.TEST_ENV ?? 'dev';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${env}`) });

export default defineConfig({
  workers: 4,
  retries: 1,
  reporter: 'html',
  projects: [
    {
      name: 'jsonplaceholder',
      use: {
        baseURL: process.env.BASE_URL ?? 'https://jsonplaceholder.typicode.com',
        extraHTTPHeaders: {},
      },
      testMatch: ['**/posts/*.spec.ts']
    },
    {
      name: 'github',
      use: {
        baseURL: 'https://api.github.com',
        extraHTTPHeaders: {
          'Authorization': `Bearer ${process.env.GH_API_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
      testMatch: ['**/github/*.spec.ts'],
    },
  ],
});
