import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('mobile chat layout', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.route('**/auth/verify', r =>
    r.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ user: { userId: 'u1', email: 'test@test.com', role: 'user' } }) })
  );
  await page.route('**/chat/conversations', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );

  await page.goto('/#/chat');
  await page.waitForSelector('.chat-textarea');
  await page.waitForTimeout(400);

  const dir = path.join(__dirname, '..', 'playwright-screenshots');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'mobile-chat.png'), await page.screenshot());
});
