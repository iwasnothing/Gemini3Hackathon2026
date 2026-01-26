import { test } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('Application User Journeys', () => {
  test('complete application walkthrough with screenshots', async ({ page }) => {
    const helper = new TestHelper('Complete Application Walkthrough');

    // Setup user context
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('currentUser', JSON.stringify({
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin'
      }));
    });

    // Home Page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await helper.captureStep(page, 'Home Page', 'Application landing page with navigation');

    // Data Sources Journey
    await page.click('text=Data Sources');
    await page.waitForURL('**/data-sources');
    await page.waitForLoadState('networkidle');
    await helper.captureStep(page, 'Data Sources List', 'View all configured data sources');

    await page.click('text=Add Data Source');
    await page.waitForSelector('.fixed.inset-0');
    await helper.captureStep(page, 'Add Data Source Modal', 'Form to configure new data source connection');

    await page.locator('.fixed.inset-0 input[type=\"text\"]').first().fill('Test PostgreSQL');
    await page.locator('.fixed.inset-0 select').first().selectOption('postgresql');
    await page.locator('.fixed.inset-0 input[type=\"text\"]').nth(1).fill('localhost');
    await page.locator('.fixed.inset-0 input[type=\"number\"]').fill('5432');
    await page.locator('.fixed.inset-0 input[type=\"text\"]').nth(2).fill('testdb');
    await page.locator('.fixed.inset-0 input[type=\"text\"]').nth(3).fill('user');
    await page.locator('.fixed.inset-0 input[type=\"password\"]').fill('pass');
    await helper.captureStep(page, 'Data Source Form Filled', 'All connection details entered');

    await page.locator('.fixed.inset-0 button:has-text(\"Connect\")').click();
    await page.waitForURL('**/data-sources');
    await page.waitForLoadState('networkidle');
    await helper.captureStep(page, 'Data Source Created', 'New data source added successfully');

    await page.click('text=View Schema');
    await page.waitForURL('**/schema');
    await page.waitForLoadState('networkidle');
    await helper.captureStep(page, 'Database Schema View', 'Exploring tables and columns');

    // Data Cubes Journey
    await page.click('text=AI Semitic Data Layer');
    await page.waitForURL('**/data-cubes');
    await page.waitForLoadState('networkidle');
    await helper.captureStep(page, 'Data Cubes List', 'View all data cubes');

    await page.click('text=Create AI Semitic Data Layer');
    await page.waitForSelector('.fixed.inset-0');
    await helper.captureStep(page, 'Create Data Cube Modal', 'Natural language query interface');

    await page.locator('.fixed.inset-0 input[type=\"text\"]').fill('Sales Cube');
    await page.locator('.fixed.inset-0 textarea').first().fill('Monthly sales metrics');
    await page.locator('.fixed.inset-0 textarea').nth(1).fill('Show total sales by month');
    await helper.captureStep(page, 'Data Cube Form Filled', 'Cube details and NL query entered');

    await page.locator('.fixed.inset-0 button:has-text(\"Preview Query\")').click();
    await page.waitForTimeout(1500);
    await helper.captureStep(page, 'Query Preview', 'Preview of query results');

    await page.locator('.fixed.inset-0 button:has-text(\"Create AI Semitic Data Layer\")').click();
    await page.waitForURL('**/data-cubes');
    await page.waitForLoadState('networkidle');
    await helper.captureStep(page, 'Data Cube Created', 'New data cube saved');

    // Dashboards Journey
    await page.click('text=Dashboards');
    await page.waitForURL('**/dashboards');
    await page.waitForLoadState('networkidle');
    await helper.captureStep(page, 'Dashboards List', 'View all dashboards');

    await page.click('text=Create Dashboard');
    await page.waitForSelector('.fixed.inset-0');
    await helper.captureStep(page, 'Create Dashboard Modal', 'Dashboard creation form');

    await page.locator('.fixed.inset-0 input[type=\"text\"]').fill('Sales Dashboard');
    await page.locator('.fixed.inset-0 textarea').fill('Executive sales overview');
    await helper.captureStep(page, 'Dashboard Form Filled', 'Dashboard name and description');

    await page.locator('.fixed.inset-0 button:has-text(\"Create\")').click();
    await page.waitForURL('**/dashboards/**');
    await page.waitForLoadState('networkidle');
    await helper.captureStep(page, 'Dashboard Created', 'New dashboard with visualizations');

    // Open existing dashboard
    await page.click('text=Dashboards');
    await page.waitForURL('**/dashboards');
    await page.waitForLoadState('networkidle');
    
    const openButton = page.locator('button:has-text(\"Open Dashboard\")').first();
    if (await openButton.isVisible()) {
      await openButton.click();
      await page.waitForURL('**/dashboards/**');
      await page.waitForLoadState('networkidle');
      await helper.captureStep(page, 'Dashboard View', 'Interactive dashboard with widgets and AI assistant');
    }

    await helper.saveMarkdown();
  });
});
