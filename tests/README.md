# Test Automation Suite - Insight Canvas

## Overview
Comprehensive test automation suite for all user journeys in the Insight Canvas BI Dashboard application. Tests include automated screenshot capture and markdown report generation.

## Test Coverage

### 1. Data Source Management Journey
**File**: `data-sources.spec.ts`

**User Journey**:
- Navigate to Data Sources page
- Add new data source (PostgreSQL)
- Configure connection details
- Test database connection
- Save data source
- View data source details
- Explore database schema
- Edit table descriptions

**Key Validations**:
- Data source creation workflow
- Connection testing functionality
- Schema exploration
- Metadata management

---

### 2. Data Cube Creation Journey
**File**: `data-cubes.spec.ts`

**User Journey**:
- Navigate to Data Cubes page
- Create new data cube
- Enter cube metadata
- Select data source
- Write natural language query
- Preview query results
- Define dimensions
- Define measures
- Save data cube

**Key Validations**:
- Natural language query processing
- Dimension and measure configuration
- Query preview functionality
- Cube creation workflow

---

### 3. Dashboard Creation Journey
**File**: `dashboards.spec.ts`

**User Journey**:
- Navigate to Dashboards page
- Create new dashboard
- Add Line Chart widget
- Add Bar Chart widget
- Add Metric Card widget
- Add Pie Chart widget
- Add Data Table widget
- Configure each widget with data cubes

**Key Validations**:
- Dashboard creation
- Multiple widget types
- Widget configuration
- Data visualization rendering

---

### 4. AI Assistant Interaction Journey
**File**: `ai-assistant.spec.ts`

**User Journey**:
- Open existing dashboard
- Launch AI Assistant
- Ask analytical questions
- Request insights
- Perform comparative analysis
- Clear chat history

**Key Validations**:
- AI chat interface
- Question-answer flow
- Context awareness
- Insight generation

---

### 5. End-to-End Complete Journey
**File**: `end-to-end.spec.ts`

**User Journey**:
- Complete workflow from start to finish
- Configure data source
- Document schema
- Create data cube with NL query
- Build multi-widget dashboard
- Use AI assistant for insights

**Key Validations**:
- Full application workflow
- Integration between all features
- Data flow from source to visualization
- AI-powered analytics

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install --save-dev @playwright/test @types/node
npx playwright install chromium
```

### 2. Run Tests
```bash
# Run all tests
npx playwright test

# Run specific test suite
npx playwright test data-sources.spec.ts

# Run in UI mode
npx playwright test --ui

# Run with headed browser
npx playwright test --headed
```

### 3. View Results
```bash
# Open HTML report
npx playwright show-report

# View markdown reports
# Check tests/reports/ directory for detailed journey documentation
```

## Output Structure

```
tests/
├── screenshots/           # All captured screenshots
│   ├── data-source-management-journey-1.png
│   ├── data-source-management-journey-2.png
│   └── ...
├── reports/              # Markdown documentation
│   ├── data-source-management-journey.md
│   ├── data-cube-creation-journey.md
│   ├── dashboard-creation-journey.md
│   ├── ai-assistant-journey.md
│   └── complete-end-to-end-journey.md
├── helpers.ts            # Test utilities
├── data-sources.spec.ts
├── data-cubes.spec.ts
├── dashboards.spec.ts
├── ai-assistant.spec.ts
└── end-to-end.spec.ts
```

## Screenshot Capture

Each test automatically captures screenshots at key steps:
- Full page screenshots
- Numbered sequentially
- Embedded in markdown reports
- Stored in `tests/screenshots/`

## Markdown Reports

Generated reports include:
- Test execution timestamp
- Step-by-step journey documentation
- Screenshot references
- Descriptions of each action
- Located in `tests/reports/`

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: |
            tests/screenshots/
            tests/reports/
            playwright-report/
```

## Best Practices

1. **Test Data**: Uses mock data by default (no real database required)
2. **Isolation**: Each test is independent
3. **Screenshots**: Captured at every significant step
4. **Documentation**: Auto-generated markdown reports
5. **Maintainability**: Helper utilities for common operations

## Troubleshooting

### Tests Failing
- Ensure dev server is running: `npm run dev`
- Check port 3000 is available
- Verify mock data is enabled

### Screenshots Not Captured
- Check `tests/screenshots/` directory exists
- Verify write permissions
- Review test helper implementation

### Markdown Not Generated
- Check `tests/reports/` directory exists
- Verify `saveMarkdown()` is called in tests
- Review file system permissions

## Extending Tests

### Add New Test Suite
```typescript
import { test } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('New Journey', () => {
  test('should complete workflow', async ({ page }) => {
    const helper = new TestHelper('New Journey Name');
    
    // Your test steps
    await page.goto('/');
    await helper.captureStep(page, 'Step Name', 'Description');
    
    await helper.saveMarkdown();
  });
});
```

## Maintenance

- Update selectors if UI changes
- Add new journeys as features are added
- Review and update test data
- Keep dependencies updated

---

**Last Updated**: 2024
**Framework**: Playwright
**Language**: TypeScript
