import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('Data Source Management Journey', () => {
  test('should complete full data source workflow', async ({ page }) => {
    const helper = new TestHelper('Data Source Management Journey');

    await page.goto('/');
    await helper.captureStep(page, 'Home Page', 'Landing on the application home page');

    await page.click('text=Data Sources');
    await page.waitForURL('**/data-sources');
    await helper.captureStep(page, 'Data Sources List', 'Viewing all configured data sources');

    await page.click('text=Add Data Source');
    await helper.captureStep(page, 'Add Data Source Form', 'Opening the form to add a new data source');

    await page.fill('input[name="name"]', 'Test PostgreSQL DB');
    await page.selectOption('select[name="type"]', 'postgresql');
    await page.fill('input[name="host"]', 'localhost');
    await page.fill('input[name="port"]', '5432');
    await page.fill('input[name="database"]', 'testdb');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass');
    await helper.captureStep(page, 'Filled Data Source Form', 'All connection details entered');

    await page.click('button:has-text("Test Connection")');
    await page.waitForTimeout(1000);
    await helper.captureStep(page, 'Connection Test Result', 'Testing database connection');

    await page.click('button:has-text("Save")');
    await page.waitForURL('**/data-sources');
    await helper.captureStep(page, 'Data Source Created', 'New data source successfully added to the list');

    const firstDataSource = page.locator('[data-testid="data-source-item"]').first();
    await firstDataSource.click();
    await helper.captureStep(page, 'Data Source Details', 'Viewing detailed information of a data source');

    await page.click('text=View Schema');
    await helper.captureStep(page, 'Database Schema', 'Exploring database tables and columns');

    const firstTable = page.locator('[data-testid="table-item"]').first();
    await firstTable.click();
    await helper.captureStep(page, 'Table Details', 'Viewing table structure with columns and types');

    await page.click('button:has-text("Edit Description")');
    await page.fill('textarea[name="description"]', 'Customer information table');
    await page.click('button:has-text("Save Description")');
    await helper.captureStep(page, 'Updated Table Description', 'Added domain description to table');

    await helper.saveMarkdown();
  });
});
