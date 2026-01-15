import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('Data Cube Creation Journey', () => {
  test('should create data cube using natural language', async ({ page }) => {
    const helper = new TestHelper('Data Cube Creation Journey');

    await page.goto('/');
    await helper.captureStep(page, 'Home Page', 'Starting from the home page');

    await page.click('text=Data Cubes');
    await page.waitForURL('**/data-cubes');
    await helper.captureStep(page, 'Data Cubes List', 'Viewing existing data cubes');

    await page.click('text=Create Data Cube');
    await helper.captureStep(page, 'Create Data Cube Page', 'Opening data cube creation interface');

    await page.fill('input[name="name"]', 'Sales Analysis Cube');
    await page.fill('textarea[name="description"]', 'Monthly sales performance metrics');
    await helper.captureStep(page, 'Basic Information', 'Entering cube name and description');

    await page.selectOption('select[name="dataSource"]', { index: 1 });
    await helper.captureStep(page, 'Data Source Selected', 'Choosing the data source for the cube');

    const nlQuery = 'Show me total sales amount by product category and month for the last year';
    await page.fill('textarea[name="query"]', nlQuery);
    await helper.captureStep(page, 'Natural Language Query', 'Entering query in plain English');

    await page.click('button:has-text("Preview Query")');
    await page.waitForTimeout(2000);
    await helper.captureStep(page, 'Query Preview', 'Previewing the generated SQL and sample results');

    await page.click('text=Define Dimensions');
    await helper.captureStep(page, 'Dimensions Configuration', 'Configuring cube dimensions');

    await page.click('button:has-text("Add Dimension")');
    await page.fill('input[name="dimension-0"]', 'product_category');
    await page.selectOption('select[name="dimension-type-0"]', 'string');
    await helper.captureStep(page, 'First Dimension Added', 'Added product category dimension');

    await page.click('button:has-text("Add Dimension")');
    await page.fill('input[name="dimension-1"]', 'month');
    await page.selectOption('select[name="dimension-type-1"]', 'date');
    await helper.captureStep(page, 'Second Dimension Added', 'Added month dimension');

    await page.click('text=Define Measures');
    await helper.captureStep(page, 'Measures Configuration', 'Configuring cube measures');

    await page.click('button:has-text("Add Measure")');
    await page.fill('input[name="measure-0"]', 'total_sales');
    await page.selectOption('select[name="aggregation-0"]', 'sum');
    await helper.captureStep(page, 'Measure Added', 'Added total sales measure with SUM aggregation');

    await page.click('button:has-text("Create Cube")');
    await page.waitForURL('**/data-cubes');
    await helper.captureStep(page, 'Data Cube Created', 'Successfully created and saved the data cube');

    await helper.saveMarkdown();
  });
});
