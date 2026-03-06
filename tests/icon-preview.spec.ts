import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('assistant message with sparkle icon', async ({ page }) => {
  // Mock all needed API endpoints
  await page.route('**/auth/verify', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: { userId: 'u1', email: 'test@test.com', role: 'user' } }),
    })
  );
  await page.route('**/chat/conversations', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );
  await page.route('**/chat', route => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          conversationId: 'test-123',
          message: 'Hello! I am your AI assistant. How can I help you today?',
          timestamp: Date.now(),
        }),
      });
    }
    return route.continue();
  });

  await page.goto('/#/chat');
  await page.waitForSelector('.chat-textarea');
  await page.fill('.chat-textarea', 'Hello!');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);

  const dir = path.join(__dirname, '..', 'playwright-screenshots');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'chat-assistant-message.png'),
    await page.screenshot()
  );
});
