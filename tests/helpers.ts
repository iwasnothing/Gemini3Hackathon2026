import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export class TestHelper {
  private screenshotCounter = 0;
  private markdownContent: string[] = [];
  private testName: string;

  constructor(testName: string) {
    this.testName = testName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    this.markdownContent.push(`# ${testName}\n`);
    this.markdownContent.push(`Test executed: ${new Date().toISOString()}\n`);
  }

  async captureStep(page: Page, stepName: string, description?: string) {
    this.screenshotCounter++;
    const filename = `${this.testName}-${this.screenshotCounter}.png`;
    const screenshotPath = path.join('tests', 'screenshots', filename);
    
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    this.markdownContent.push(`\n## Step ${this.screenshotCounter}: ${stepName}\n`);
    if (description) {
      this.markdownContent.push(`${description}\n`);
    }
    this.markdownContent.push(`![${stepName}](../screenshots/${filename})\n`);
  }

  async saveMarkdown() {
    const markdownPath = path.join('tests', 'reports', `${this.testName}.md`);
    fs.writeFileSync(markdownPath, this.markdownContent.join('\n'));
  }
}
