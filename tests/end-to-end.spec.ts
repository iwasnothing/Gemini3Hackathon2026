import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('End-to-End Complete User Journey', () => {
  test('should complete full workflow from data source to insights', async ({ page }) => {
    const helper = new TestHelper('Complete End-to-End Journey');

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('currentUser', JSON.stringify({
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin'
      }));
    });
    await helper.captureStep(page, 'Application Home', 'Starting complete workflow from home page');

    // Step 1: Configure Data Source
    await page.click('text=Data Sources');
    await page.waitForURL('**/data-sources');
    await page.click('text=Add Data Source');
    await page.waitForSelector('input[type="text"]');
    await page.locator('input[type="text"]').first().fill('Production Database');
    await page.locator('select').first().selectOption('postgresql');
    await page.locator('input[type="text"]').nth(1).fill('prod-db.example.com');
    await page.locator('input[type="number"]').fill('5432');
    await page.locator('input[type="text"]').nth(2).fill('analytics');
    await page.locator('input[type="text"]').nth(3).fill('analyst');
    await page.locator('input[type="password"]').fill('secure123');
    await page.click('button:has-text("Connect")');
    await page.waitForURL('**/data-sources');
    await helper.captureStep(page, 'Data Source Configured', 'Production database connected');

    // Step 2: Explore Schema
    await page.click('text=View Schema');
    await page.waitForURL('**/schema');
    await helper.captureStep(page, 'Schema Exploration', 'Reviewing database structure');

    // Step 3: Create Data Cube
    await page.click('text=AI Semitic Data Layer');
    await page.waitForURL('**/data-cubes');
    await page.click('text=Create AI Semitic Data Layer');
    await page.waitForSelector('.fixed.inset-0');
    await page.locator('.fixed.inset-0 input[type="text"]').fill('Revenue Analytics');
    await page.locator('.fixed.inset-0 textarea').first().fill('Quarterly revenue analysis');
    await page.locator('.fixed.inset-0 textarea').nth(1).fill('Calculate total revenue by region and product line for each quarter');
    await page.locator('.fixed.inset-0 button:has-text("Preview Query")').click();
    await page.waitForTimeout(2000);
    await helper.captureStep(page, 'Data Cube Query', 'Natural language query processed');

    await page.locator('.fixed.inset-0 button:has-text("Create AI Semitic Data Layer")').click();
    await page.waitForURL('**/data-cubes');
    await helper.captureStep(page, 'Data Cube Created', 'Analytics cube ready for visualization');

    // Step 4: Build Dashboard
    await page.click('text=Dashboards');
    await page.waitForURL('**/dashboards');
    await page.click('text=Create Dashboard');
    await page.waitForSelector('.fixed.inset-0');
    await page.locator('.fixed.inset-0 input[type="text"]').fill('Executive Revenue Dashboard');
    await page.locator('.fixed.inset-0 textarea').fill('Key revenue metrics for leadership team');
    await page.locator('.fixed.inset-0 button:has-text("Create")').click();
    await page.waitForURL('**/dashboards/**');
    await helper.captureStep(page, 'Dashboard Complete', 'Full workflow from data connection to visualization completed');

    await helper.saveMarkdown();
  });
});
