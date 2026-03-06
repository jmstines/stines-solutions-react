import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const EMAIL = process.env.TEST_EMAIL ?? '';
const PASSWORD = process.env.TEST_PASSWORD ?? '';

function saveScreenshot(name: string, buffer: Buffer) {
  const dir = path.join(__dirname, '..', 'playwright-screenshots');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${name}.png`), buffer);
}

test('debug auth - check cookies and chat API response', async ({ page }) => {
  // Login
  await page.goto('/#/login');
  await page.waitForSelector('#email');
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);

  // Capture the login response
  const loginResponsePromise = page.waitForResponse(
    (res) => res.url().includes('/auth/login'),
    { timeout: 10000 }
  );
  await page.click('button[type="submit"]');
  const loginResponse = await loginResponsePromise;
  console.log('Login status:', loginResponse.status());
  console.log('Login URL:', loginResponse.url());

  await page.waitForURL((url) => !url.hash.includes('/login'), { timeout: 10000 });

  // Check cookies after login
  const cookies = await page.context().cookies();
  console.log('Cookies after login:', JSON.stringify(cookies.map(c => ({
    name: c.name,
    domain: c.domain,
    path: c.path,
    secure: c.secure,
    sameSite: c.sameSite,
    expires: c.expires,
  })), null, 2));

  // Navigate to chat
  await page.goto('/#/chat');
  await page.waitForSelector('.chat-textarea', { timeout: 10000 });

  // Intercept the chat API call
  const chatResponsePromise = page.waitForResponse(
    (res) => res.url().includes('/chat') && !res.url().includes('/conversations'),
    { timeout: 15000 }
  );

  await page.fill('.chat-textarea', 'Hello test');
  await page.keyboard.press('Enter');

  try {
    const chatResponse = await chatResponsePromise;
    console.log('Chat API status:', chatResponse.status());
    const body = await chatResponse.text();
    console.log('Chat API response body:', body);
  } catch (e) {
    console.log('Chat API response error:', e);
  }

  const buffer = await page.screenshot({ fullPage: false });
  saveScreenshot('debug-auth', buffer);
});
