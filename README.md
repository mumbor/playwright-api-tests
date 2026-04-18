# Playwright API Tests

A comprehensive API testing suite built with Playwright and TypeScript for testing RESTful APIs.

> **Note:** This project is an exercise to learn and practice how to use Playwright for API testing.

## Project Structure

```
api-tests/
├── lib/
│   ├── PostsApi.ts          # Posts API utility class
│   └── GithubApi.ts         # GitHub API utility class
├── tests/
│   ├── first.spec.ts        # Initial test example
│   ├── posts.spec.ts        # Posts API tests (basic)
│   ├── posts-v2.spec.ts     # Posts API tests (refactored with PostsApi class)
│   ├── github.spec.ts       # GitHub API tests
│   └── crud.spec.ts         # CRUD operations tests
├── playwright.config.ts     # Playwright configuration
├── package.json             # Project dependencies
├── .env                     # Environment variables
└── .gitignore              # Git ignore file
```

## Setup

### Prerequisites
- Node.js 16+ installed
- npm or yarn

### Installation

1. Clone or navigate to the project directory:
```bash
cd api-tests
```

2. Install dependencies:
```bash
npm install
```

3. Install Playwright browsers:
```bash
npx playwright install
```

## Configuration

The project uses a `.env` file for environment variables:

```env
BASE_URL=https://jsonplaceholder.typicode.com
API_TIMEOUT=30000
```

For GitHub API testing, add your token:
```env
GITHUB_TOKEN=your_github_token_here
```

## Running Tests

### Run all tests
```bash
npx playwright test
```

### Run a specific test file
```bash
npx playwright test tests/posts.spec.ts
```

### Run tests with list reporter
```bash
npx playwright test --reporter=list
```

### Run tests in headed mode (show browser)
```bash
npx playwright test --headed
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

## Test Files

- **posts.spec.ts** - Basic CRUD operations for Posts API using raw requests
- **posts-v2.spec.ts** - Posts API tests using the `PostsApi` helper class (recommended approach)
- **github.spec.ts** - Tests for GitHub API operations (search, user repos, issues)
- **crud.spec.ts** - Demonstrates CRUD flow (note: works with existing JSONPlaceholder IDs)
- **first.spec.ts** - Initial test example

## API Classes

### PostsApi
Located in `lib/PostsApi.ts`, manages all Posts API operations:
- `getAllPosts()` - Get all posts
- `getPost(id)` - Get a specific post
- `createPost(data)` - Create a new post
- `getPostsByUser(userId)` - Get posts by user ID
- `updatePost(id, data)` - Update a post
- `deletePost(id)` - Delete a post

### GithubApi
Located in `lib/GithubApi.ts`, manages GitHub API operations:
- `getUser(username)` - Get user information
- `getUserRepos(username)` - Get user repositories
- `getRepo(owner, repo)` - Get a specific repository
- `searchRepositories(query)` - Search for repositories
- `getIssues(owner, repo)` - Get repository issues

## Notes

- Tests use JSONPlaceholder as a mock API (data is not persisted)
- For persistent data testing, connect to a real backend or database
- GitHub API tests use public endpoints (no authentication required for basic operations)
- HTML reports are generated in `playwright-report/` after test runs

## Troubleshooting

### Tests fail with "Object.is equality" errors
- Ensure `baseURL` is configured in `playwright.config.ts`
- Check that the API endpoints are accessible

### Type errors for `process.env`
- Install type definitions: `npm install -D @types/node`

## License

MIT
