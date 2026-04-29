const { chromium } = require('playwright');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const baseUrl = 'http://127.0.0.1:7848';
const outDir = '/tmp/prompt-armor-frontend-smoke';
mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });

  const consoleEvents = [];
  const pageErrors = [];
  const requestFailures = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleEvents.push({ type: msg.type(), text: msg.text(), url: page.url() });
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push({ message: String(err), url: page.url() });
  });
  page.on('requestfailed', (req) => {
    requestFailures.push({
      url: req.url(),
      method: req.method(),
      error: req.failure()?.errorText || 'unknown',
      page: page.url(),
    });
  });

  async function snap(name) {
    await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: true });
  }

  async function goto(path, name) {
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
    await snap(name);
  }

  function logStep(name) {
    console.log(`[step] ${name}`);
  }

  page.setDefaultTimeout(10000);

  logStep('welcome');
  await goto('/welcome', 'welcome');
  logStep('dashboard');
  await goto('/', 'dashboard');
  logStep('models');
  await goto('/models', 'models-empty');

  logStep('models create open');
  await page.getByRole('button', { name: /add model/i }).click();
  const modalInputs = page.locator('.glass input');
  await modalInputs.nth(0).fill('Smoke Model');
  await modalInputs.nth(1).fill('http://127.0.0.1:9/v1');
  await modalInputs.nth(2).fill('sk-test-frontend-smoke');
  await modalInputs.nth(3).fill('gpt-4o-mini');
  await modalInputs.nth(4).fill('0.3');
  await page.getByRole('button', { name: /save/i }).click();
  await page.waitForLoadState('networkidle');
  await snap('models-after-create');

  logStep('models test');
  await page.getByRole('button', { name: /test/i }).first().click();
  await page.waitForTimeout(1200);
  await snap('models-test-fail');

  logStep('tools');
  await goto('/tools', 'tools');
  await page.getByRole('button', { name: /\+\s*new profile/i }).click();
  await page.getByPlaceholder('My Agent Profile').fill('Smoke Profile');
  await page.locator('.glass input[type="checkbox"]').first().check();
  await page.getByRole('button', { name: /new profile/i }).nth(1).click();
  await page.waitForLoadState('networkidle');
  await snap('tools-after-profile');

  logStep('eval');
  await goto('/eval', 'eval');
  const selects = page.locator('select');
  await selects.nth(0).selectOption({ index: 1 });
  await selects.nth(1).selectOption({ index: 1 });
  await selects.nth(2).selectOption({ index: 1 });
  await selects.nth(3).selectOption({ index: 1 });
  await page.getByRole('button', { name: /start/i }).click();
  await page.waitForURL(/\/eval\/e-/);
  await page.waitForTimeout(4000);
  await snap('eval-running');

  logStep('reports');
  await goto('/reports', 'reports');
  logStep('auto');
  await goto('/auto', 'auto');
  logStep('samples');
  await goto('/samples', 'samples');
  logStep('prompts');
  await goto('/prompts', 'prompts');
  logStep('settings');
  await goto('/settings', 'settings');
  logStep('help');
  await goto('/help', 'help');

  writeFileSync(join(outDir, 'result.json'), JSON.stringify({
    consoleEvents,
    pageErrors,
    requestFailures,
    finalUrl: page.url(),
  }, null, 2));

  await browser.close();
  console.log(outDir);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
