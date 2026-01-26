# Quick Start - Test Automation

## Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install chromium

# 3. Run all tests
npm run test

# 4. View results
npm run test:report
```

## Test Suites

- **data-sources.spec.ts** - Data source configuration journey
- **data-cubes.spec.ts** - Data cube creation with NL queries
- **dashboards.spec.ts** - Dashboard building with widgets
- **ai-assistant.spec.ts** - AI chat interactions
- **end-to-end.spec.ts** - Complete workflow

## Output

- **Screenshots**: `tests/screenshots/`
- **Markdown Reports**: `tests/reports/`
- **HTML Report**: `playwright-report/`

## Run Specific Test

```bash
npx playwright test data-sources.spec.ts
```

## Debug Mode

```bash
npm run test:ui
```
