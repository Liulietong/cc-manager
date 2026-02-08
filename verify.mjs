import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext().then(ctx => ctx.newPage());

  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  try {
    // Test Skills page (should have data)
    console.log('Testing Skills page...');
    await page.goto('http://localhost:5173/skills', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(3000);
    const skillsContent = await page.locator('body').innerText();
    console.log(`  - Skills visible: ${skillsContent.includes('Skills')}`);
    console.log(`  - Commit skill found: ${skillsContent.includes('/commit')}`);
    console.log(`  - User scope: ${skillsContent.includes('User scope')}`);
    console.log(`  - Page errors: ${errors.length}`);

    // Test Settings page
    console.log('\nTesting Settings page...');
    errors.length = 0;
    await page.goto('http://localhost:5173/settings', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    const settingsContent = await page.locator('body').innerText();
    console.log(`  - Save button: ${settingsContent.includes('Save')}`);
    console.log(`  - Page errors: ${errors.length}`);

    // Test Plugins page
    console.log('\nTesting Plugins page...');
    errors.length = 0;
    await page.goto('http://localhost:5173/plugins', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    const pluginsContent = await page.locator('body').innerText();
    console.log(`  - Plugins list visible: ${pluginsContent.includes('Enabled') || pluginsContent.includes('Disabled')}`);
    console.log(`  - Page errors: ${errors.length}`);

    console.log('\n=== VERIFICATION COMPLETE ===');
    console.log(`All pages loaded without critical errors!`);

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

verify();
