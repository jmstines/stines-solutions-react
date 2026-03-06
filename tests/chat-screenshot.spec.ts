import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const EMAIL = process.env.TEST_EMAIL ?? '';
const PASSWORD = process.env.TEST_PASSWORD ?? '';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/#/login');
  await page.waitForSelector('#email');
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);
  await page.click('button[type="submit"]');
  // Wait for navigation away from login
  await page.waitForURL((url) => !url.hash.includes('/login'), { timeout: 10000 });
}

function saveScreenshot(name: string, buffer: Buffer) {
  const dir = path.join(__dirname, '..', 'playwright-screenshots');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.png`);
  fs.writeFileSync(file, buffer);
  console.log(`Screenshot saved: ${file}`);
}

test.describe('Chat page visual', () => {
  test.beforeEach(async ({ page }) => {
    if (!EMAIL || !PASSWORD) {
      test.skip(true, 'TEST_EMAIL and TEST_PASSWORD env vars required');
    }
    await login(page);
  });

  test('empty chat state', async ({ page }) => {
    await page.goto('/#/chat');
    await page.waitForSelector('.chat-container', { timeout: 10000 });
    // Wait for conversations to load
    await page.waitForTimeout(500);
    const buffer = await page.screenshot({ fullPage: false });
    saveScreenshot('chat-empty', buffer);
    await expect(page.locator('.chat-container')).toBeVisible();
  });

  test('chat with sidebar closed', async ({ page }) => {
    await page.goto('/#/chat');
    await page.waitForSelector('.chat-container');
    // Close the sidebar
    await page.locator('.sidebar-toggle-btn').click();
    await page.waitForTimeout(300);
    const buffer = await page.screenshot({ fullPage: false });
    saveScreenshot('chat-sidebar-closed', buffer);
  });

  test('chat with message', async ({ page }) => {
    await page.goto('/#/chat');
    await page.waitForSelector('.chat-textarea');
    await page.fill('.chat-textarea', 'Hello! This is a test message.');
    const buffer = await page.screenshot({ fullPage: false });
    saveScreenshot('chat-with-input', buffer);
  });
});
