# Playwright API Test Suite

A production-grade API test suite built with Playwright and TypeScript.

![CI](https://github.com/mumbor/api-tests/actions/workflows/playwright.yml/badge.svg)

## What this suite tests

- **JSONPlaceholder API** — CRUD operations, error responses, schema validation, performance
- **GitHub REST API** — authenticated requests, pagination, error handling
- **GitHub GraphQL API** — queries, variables, error detection
- **Contract tests** — consumer-driven contract verification with Pact

## Tech stack

- [Playwright](https://playwright.dev) — test runner and HTTP client
- [TypeScript](https://www.typescriptlang.org) — typed test code
- [Zod](https://zod.dev) — runtime response schema validation
- [Faker](https://fakerjs.dev) — dynamic test data generation
- [Pact](https://pact.io) — consumer-driven contract testing
- [Allure](https://allurereport.org) — test reporting

## Setup

1. Clone the repo
2. Install dependencies:
```bash
   npm install
```
3. Copy `.env.dev` and fill in your values:

GH_API_TOKEN=your_github_personal_access_token
GH_USERNAME=your_github_username
BASE_URL=https://jsonplaceholder.typicode.com

## Running tests

Run all tests:
```bash
npx playwright test
```

Run smoke tests only (fast, ~30 seconds):
```bash
npx playwright test --grep "@smoke"
```

Run a specific project:
```bash
npx playwright test --project=jsonplaceholder
npx playwright test --project=github
npx playwright test --project=performance
```

Run against staging:
```powershell
$env:TEST_ENV="staging"; npx playwright test
```

## Reports

Open the built-in HTML report:
```bash
npx playwright show-report
```

Generate and open the Allure report:
```bash
npx allure generate allure-results --clean
npx allure open
```

## CI

Tests run automatically on every push and pull request via GitHub Actions.
Performance tests run on a weekly schedule every Monday at 9am.

## Adding new tests

1. Create a spec file in the relevant `tests/` subfolder
2. Import from `../lib/fixtures` to get pre-configured API clients
3. Use `createPostData()` from `lib/factories.ts` for test data
4. Add the file to the correct project `testMatch` in `playwright.config.ts`
5. Tag critical tests with `@smoke`