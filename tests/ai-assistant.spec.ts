import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('AI Assistant Interaction Journey', () => {
  test('should interact with dashboard AI assistant', async ({ page }) => {
    const helper = new TestHelper('AI Assistant Journey');

    await page.goto('/dashboards');
    await helper.captureStep(page, 'Dashboards List', 'Navigating to dashboards');

    const firstDashboard = page.locator('[data-testid="dashboard-item"]').first();
    await firstDashboard.click();
    await helper.captureStep(page, 'Dashboard View', 'Opening dashboard with data visualizations');

    await page.click('button:has-text("AI Assistant")');
    await helper.captureStep(page, 'AI Assistant Panel', 'Opening the AI assistant chat interface');

    await page.fill('textarea[name="message"]', 'What are the top 3 performing product categories?');
    await page.click('button:has-text("Send")');
    await page.waitForTimeout(2000);
    await helper.captureStep(page, 'First Question Response', 'AI assistant analyzing data and providing insights');

    await page.fill('textarea[name="message"]', 'Show me the trend for the best performing category');
    await page.click('button:has-text("Send")');
    await page.waitForTimeout(2000);
    await helper.captureStep(page, 'Follow-up Question', 'AI providing detailed trend analysis');

    await page.fill('textarea[name="message"]', 'What insights can you provide about seasonal patterns?');
    await page.click('button:has-text("Send")');
    await page.waitForTimeout(2000);
    await helper.captureStep(page, 'Insights Request', 'AI identifying seasonal patterns in the data');

    await page.fill('textarea[name="message"]', 'Compare this month vs last month performance');
    await page.click('button:has-text("Send")');
    await page.waitForTimeout(2000);
    await helper.captureStep(page, 'Comparison Analysis', 'AI performing comparative analysis');

    await page.click('button:has-text("Clear Chat")');
    await helper.captureStep(page, 'Chat Cleared', 'Starting fresh conversation with AI assistant');

    await helper.saveMarkdown();
  });
});
