import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('Data Cube Creation Journey', () => {
  test('should create data cube using natural language', async ({ page }) => {
    const helper = new TestHelper('Data Cube Creation Journey');

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('currentUser', JSON.stringify({
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin'
      }));
    });
    await helper.captureStep(page, 'Home Page', 'Starting from the home page');

    await page.click('text=AI Semitic Data Layer');
    await page.waitForURL('**/data-cubes');
    await helper.captureStep(page, 'Data Cubes List', 'Viewing existing data cubes');

    await page.click('text=Create AI Semitic Data Layer');
    await page.waitForSelector('.fixed.inset-0');
    await helper.captureStep(page, 'Create Data Cube Page', 'Opening data cube creation interface');

    await page.locator('.fixed.inset-0 input[type="text"]').fill('Sales Analysis Cube');
    await page.locator('.fixed.inset-0 textarea').first().fill('Monthly sales performance metrics');
    await helper.captureStep(page, 'Basic Information', 'Entering cube name and description');

    const nlQuery = 'Show me total sales amount by product category and month for the last year';
    await page.locator('.fixed.inset-0 textarea').nth(1).fill(nlQuery);
    await helper.captureStep(page, 'Natural Language Query', 'Entering query in plain English');

    await page.locator('.fixed.inset-0 button:has-text("Preview Query")').click();
    await page.waitForTimeout(2000);
    await helper.captureStep(page, 'Query Preview', 'Previewing the generated SQL and sample results');

    await page.locator('.fixed.inset-0 button:has-text("Create AI Semitic Data Layer")').click();
    await page.waitForURL('**/data-cubes');
    await helper.captureStep(page, 'Data Cube Created', 'Successfully created and saved the data cube');

    await helper.saveMarkdown();
  });
});
