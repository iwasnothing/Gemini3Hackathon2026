# Test Automation

## Objective

The test automation suite is designed to **quickly walkthrough user journeys** and generate visual documentation of the application flow. This is NOT intended for CI/CD pipelines or quality management purposes.

## Purpose

- **Visual Documentation**: Capture screenshots of key user interactions
- **Demo Preparation**: Generate step-by-step walkthroughs for presentations
- **Feature Showcase**: Document application capabilities with real UI examples
- **Quick Validation**: Verify basic user flows work end-to-end

## Running Tests

```bash
npm run test
```

## Test Coverage

### 1. Complete Application Walkthrough
- Full journey from data sources to dashboards
- Captures all major features in sequence

### 2. Data Source Management
- Adding and configuring data sources
- Viewing database schemas

### 3. AI Semitic Data Layer Creation
- Creating data layers with natural language queries
- Previewing query results

### 4. Dashboard Creation
- Building interactive dashboards
- Adding widgets and visualizations

### 5. AI Assistant Interaction
- Using the dashboard AI assistant
- Natural language Q&A

### 6. End-to-End Journey
- Complete workflow from data connection to insights

## Output

Tests generate:
- Screenshots in `test-results/` directory
- Markdown documentation with embedded images
- Video recordings of test runs

## Important Notes

- **Not for CI/CD**: These tests are for documentation, not continuous integration
- **Not for Quality Assurance**: Not designed to catch bugs or regressions
- **Manual Review**: Output is meant for human review and presentation
- **Demo Tool**: Primary use case is creating demo materials and documentation
- **Rapid Development**: Project is undergoing rapid development with frequent user journey changes, which may cause tests to break. This is expected and acceptable given the documentation-focused purpose.
