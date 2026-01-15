import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('End-to-End Complete User Journey', () => {
  test('should complete full workflow from data source to insights', async ({ page }) => {
    const helper = new TestHelper('Complete End-to-End Journey');

    await page.goto('/');
    await helper.captureStep(page, 'Application Home', 'Starting complete workflow from home page');

    // Step 1: Configure Data Source
    await page.click('text=Data Sources');
    await page.waitForURL('**/data-sources');
    await page.click('text=Add Data Source');
    await page.fill('input[name="name"]', 'Production Database');
    await page.selectOption('select[name="type"]', 'postgresql');
    await page.fill('input[name="host"]', 'prod-db.example.com');
    await page.fill('input[name="port"]', '5432');
    await page.fill('input[name="database"]', 'analytics');
    await page.fill('input[name="username"]', 'analyst');
    await page.fill('input[name="password"]', 'secure123');
    await page.click('button:has-text("Save")');
    await page.waitForURL('**/data-sources');
    await helper.captureStep(page, 'Data Source Configured', 'Production database connected');

    // Step 2: Explore and Document Schema
    const dataSource = page.locator('[data-testid="data-source-item"]').first();
    await dataSource.click();
    await page.click('text=View Schema');
    await helper.captureStep(page, 'Schema Exploration', 'Reviewing database structure');

    const table = page.locator('[data-testid="table-item"]').first();
    await table.click();
    await page.click('button:has-text("Edit Description")');
    await page.fill('textarea[name="description"]', 'Sales transactions with customer and product details');
    await page.click('button:has-text("Save Description")');
    await helper.captureStep(page, 'Schema Documented', 'Added business context to tables');

    // Step 3: Create Data Cube
    await page.click('text=Data Cubes');
    await page.waitForURL('**/data-cubes');
    await page.click('text=Create Data Cube');
    await page.fill('input[name="name"]', 'Revenue Analytics');
    await page.selectOption('select[name="dataSource"]', { index: 1 });
    await page.fill('textarea[name="query"]', 'Calculate total revenue by region and product line for each quarter');
    await page.click('button:has-text("Preview Query")');
    await page.waitForTimeout(2000);
    await helper.captureStep(page, 'Data Cube Query', 'Natural language query processed');

    await page.click('button:has-text("Add Dimension")');
    await page.fill('input[name="dimension-0"]', 'region');
    await page.click('button:has-text("Add Dimension")');
    await page.fill('input[name="dimension-1"]', 'product_line');
    await page.click('button:has-text("Add Measure")');
    await page.fill('input[name="measure-0"]', 'revenue');
    await page.click('button:has-text("Create Cube")');
    await page.waitForURL('**/data-cubes');
    await helper.captureStep(page, 'Data Cube Created', 'Analytics cube ready for visualization');

    // Step 4: Build Dashboard
    await page.click('text=Dashboards');
    await page.waitForURL('**/dashboards');
    await page.click('text=Create Dashboard');
    await page.fill('input[name="name"]', 'Executive Revenue Dashboard');
    await page.fill('textarea[name="description"]', 'Key revenue metrics for leadership team');
    await page.click('button:has-text("Create")');
    await page.waitForURL('**/dashboards/**');
    await helper.captureStep(page, 'Dashboard Created', 'Empty dashboard ready for widgets');

    // Add multiple widgets
    await page.click('button:has-text("Add Widget")');
    await page.click('text=Metric Card');
    await page.fill('input[name="widget-title"]', 'Total Revenue');
    await page.selectOption('select[name="data-cube"]', { index: 1 });
    await page.click('button:has-text("Add to Dashboard")');

    await page.click('button:has-text("Add Widget")');
    await page.click('text=Line Chart');
    await page.fill('input[name="widget-title"]', 'Quarterly Trend');
    await page.selectOption('select[name="data-cube"]', { index: 1 });
    await page.click('button:has-text("Add to Dashboard")');

    await page.click('button:has-text("Add Widget")');
    await page.click('text=Bar Chart');
    await page.fill('input[name="widget-title"]', 'Revenue by Region');
    await page.selectOption('select[name="data-cube"]', { index: 1 });
    await page.click('button:has-text("Add to Dashboard")');
    await helper.captureStep(page, 'Dashboard Complete', 'All visualizations configured');

    // Step 5: Use AI Assistant
    await page.click('button:has-text("AI Assistant")');
    await page.fill('textarea[name="message"]', 'Which region has the highest growth rate?');
    await page.click('button:has-text("Send")');
    await page.waitForTimeout(2000);
    await helper.captureStep(page, 'AI Analysis', 'Getting insights from AI assistant');

    await page.fill('textarea[name="message"]', 'What recommendations do you have to improve revenue?');
    await page.click('button:has-text("Send")');
    await page.waitForTimeout(2000);
    await helper.captureStep(page, 'AI Recommendations', 'Receiving actionable recommendations');

    await helper.captureStep(page, 'Journey Complete', 'Full workflow from data connection to AI-powered insights completed');

    await helper.saveMarkdown();
  });
});
