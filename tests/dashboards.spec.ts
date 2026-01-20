import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('Dashboard Creation and Interaction Journey', () => {
  test('should create interactive dashboard with widgets', async ({ page }) => {
    const helper = new TestHelper('Dashboard Creation Journey');

    await page.goto('/');
    await helper.captureStep(page, 'Home Page', 'Starting the dashboard creation journey');

    await page.click('text=Dashboards');
    await page.waitForURL('**/dashboards');
    await helper.captureStep(page, 'Dashboards List', 'Viewing all available dashboards');

    await page.click('text=Create Dashboard');
    await page.waitForSelector('.fixed.inset-0');
    await helper.captureStep(page, 'Create Dashboard Form', 'Opening dashboard creation form');

    await page.locator('.fixed.inset-0 input[type="text"]').fill('Sales Performance Dashboard');
    await page.locator('.fixed.inset-0 textarea').fill('Real-time sales metrics and trends');
    await helper.captureStep(page, 'Dashboard Details Filled', 'Entered dashboard name and description');

    await page.locator('.fixed.inset-0 button:has-text("Create")').click();
    await page.waitForURL('**/dashboards/**');
    await helper.captureStep(page, 'Dashboard Created', 'New dashboard created successfully');

    await helper.saveMarkdown();
  });
});
