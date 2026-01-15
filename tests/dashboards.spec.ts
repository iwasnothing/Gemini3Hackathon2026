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
    await helper.captureStep(page, 'Create Dashboard Form', 'Opening dashboard creation form');

    await page.fill('input[name="name"]', 'Sales Performance Dashboard');
    await page.fill('textarea[name="description"]', 'Real-time sales metrics and trends');
    await page.click('button:has-text("Create")');
    await page.waitForURL('**/dashboards/**');
    await helper.captureStep(page, 'Empty Dashboard', 'New dashboard created, ready to add widgets');

    await page.click('button:has-text("Add Widget")');
    await helper.captureStep(page, 'Widget Type Selection', 'Choosing widget type to add');

    await page.click('text=Line Chart');
    await helper.captureStep(page, 'Line Chart Configuration', 'Configuring line chart widget');

    await page.fill('input[name="widget-title"]', 'Monthly Sales Trend');
    await page.selectOption('select[name="data-cube"]', { index: 1 });
    await page.selectOption('select[name="x-axis"]', 'month');
    await page.selectOption('select[name="y-axis"]', 'total_sales');
    await helper.captureStep(page, 'Chart Configuration Complete', 'All chart parameters configured');

    await page.click('button:has-text("Add to Dashboard")');
    await helper.captureStep(page, 'Line Chart Added', 'Line chart widget added to dashboard');

    await page.click('button:has-text("Add Widget")');
    await page.click('text=Bar Chart');
    await page.fill('input[name="widget-title"]', 'Sales by Category');
    await page.selectOption('select[name="data-cube"]', { index: 1 });
    await page.selectOption('select[name="x-axis"]', 'product_category');
    await page.selectOption('select[name="y-axis"]', 'total_sales');
    await page.click('button:has-text("Add to Dashboard")');
    await helper.captureStep(page, 'Bar Chart Added', 'Bar chart widget showing category breakdown');

    await page.click('button:has-text("Add Widget")');
    await page.click('text=Metric Card');
    await page.fill('input[name="widget-title"]', 'Total Revenue');
    await page.selectOption('select[name="data-cube"]', { index: 1 });
    await page.selectOption('select[name="metric"]', 'total_sales');
    await page.click('button:has-text("Add to Dashboard")');
    await helper.captureStep(page, 'Metric Card Added', 'KPI metric card displaying total revenue');

    await page.click('button:has-text("Add Widget")');
    await page.click('text=Pie Chart');
    await page.fill('input[name="widget-title"]', 'Market Share');
    await page.selectOption('select[name="data-cube"]', { index: 1 });
    await page.selectOption('select[name="category"]', 'product_category');
    await page.selectOption('select[name="value"]', 'total_sales');
    await page.click('button:has-text("Add to Dashboard")');
    await helper.captureStep(page, 'Pie Chart Added', 'Pie chart showing market share distribution');

    await page.click('button:has-text("Add Widget")');
    await page.click('text=Data Table');
    await page.fill('input[name="widget-title"]', 'Detailed Sales Data');
    await page.selectOption('select[name="data-cube"]', { index: 1 });
    await page.click('button:has-text("Add to Dashboard")');
    await helper.captureStep(page, 'Complete Dashboard', 'Dashboard with all widget types configured');

    await helper.saveMarkdown();
  });
});
