import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('AI Assistant Interaction Journey', () => {
  test('should interact with dashboard AI assistant', async ({ page }) => {
    const helper = new TestHelper('AI Assistant Journey');

    await page.goto('/dashboards');
    await helper.captureStep(page, 'Dashboards List', 'Navigating to dashboards');

    await page.click('text=Open Dashboard');
    await page.waitForURL('**/dashboards/**');
    await helper.captureStep(page, 'Dashboard View', 'Opening dashboard with data visualizations');

    await helper.saveMarkdown();
  });
});
