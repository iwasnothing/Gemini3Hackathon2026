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
    await page.waitForSelector('input[type="text"]');
    await helper.captureStep(page, 'Add Data Source Form', 'Opening the form to add a new data source');

    await page.locator('input[type="text"]').first().fill('Test PostgreSQL DB');
    await page.locator('select').first().selectOption('postgresql');
    await page.locator('input[type="text"]').nth(1).fill('localhost');
    await page.locator('input[type="number"]').fill('5432');
    await page.locator('input[type="text"]').nth(2).fill('testdb');
    await page.locator('input[type="text"]').nth(3).fill('testuser');
    await page.locator('input[type="password"]').fill('testpass');
    await helper.captureStep(page, 'Filled Data Source Form', 'All connection details entered');

    await page.click('button:has-text("Connect")');
    await page.waitForURL('**/data-sources');
    await helper.captureStep(page, 'Data Source Created', 'New data source successfully added to the list');

    await page.click('text=View Schema');
    await page.waitForURL('**/schema');
    await helper.captureStep(page, 'Database Schema', 'Exploring database tables and columns');

    await helper.saveMarkdown();
  });
});
