// End-to-end test of the showcase, run against the production build: `bun run build && bun run test:e2e`.
// Starts `vite preview`, loads every demo in a headless Chrome, and fails on a demo that renders no SVG, an uncaught
// error, a console error, an HTTP error or a failed request. Then runs the behaviour scenarios of e2e/scenarios.mjs.
// The browser is the local Google Chrome, or E2E_BROWSER_PATH, any Chromium based executable. E2E_PORT (default 4173)
// and E2E_OUT_DIR (default dist) select the port and the build to serve.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { scenarios } from './scenarios.mjs';

const appDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.E2E_PORT ?? 4173);
const baseUrl = `http://localhost:${port}`;
const renderTimeoutInMs = 10_000;

const fail = (message) => {
  console.error(message);
  process.exitCode = 2;
};

const startServer = async () => {
  // The bin script run by the current node: no shell, and no dependency on the shims the package manager writes in
  // node_modules/.bin, which differ between Windows and the other platforms
  const vitePackageJson = createRequire(import.meta.url).resolve('vite/package.json');
  const server = spawn(
    process.execPath,
    [
      join(dirname(vitePackageJson), 'bin', 'vite.js'),
      'preview',
      '--port',
      String(port),
      '--strictPort',
      // Vite refuses a second preview of the same app, such as a 'bun run preview' left open: each uses its own port
      '--bypass-lock',
      ...(process.env.E2E_OUT_DIR ? ['--outDir', process.env.E2E_OUT_DIR] : []),
    ],
    { cwd: appDir, stdio: ['ignore', 'pipe', 'pipe'] }
  );
  let output = '';
  server.stdout.on('data', (chunk) => (output += chunk));
  server.stderr.on('data', (chunk) => (output += chunk));
  const deadline = Date.now() + 30_000;
  let lastAnswer = 'no answer';
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`vite preview exited:\n${output}`);
    lastAnswer = await fetch(baseUrl).then(
      (response) => `HTTP ${response.status}`,
      (error) => `${error.message} ${error.cause?.code ?? ''}`
    );
    if (lastAnswer === 'HTTP 200') return server;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  server.kill();
  throw new Error(
    `vite preview did not serve ${baseUrl} within 30 s, last answer: ${lastAnswer}. Is the build in ${process.env.E2E_OUT_DIR ?? 'dist'} complete?\n${output}`
  );
};

const launchBrowser = async () => {
  const candidates = process.env.E2E_BROWSER_PATH
    ? [{ executablePath: process.env.E2E_BROWSER_PATH }]
    : [{ channel: 'chrome' }, {}];
  const errors = [];
  for (const options of candidates) {
    try {
      return await chromium.launch(options);
    } catch (error) {
      errors.push(error.message.split('\n')[0]);
    }
  }
  throw new Error(
    `No browser found, install Google Chrome or set E2E_BROWSER_PATH:\n${errors.join('\n')}`
  );
};

/** A fresh context per page, so that a request or an error is reported on the demo that caused it. */
const openPage = async (browser, label, problems) => {
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (error) =>
    problems.push(`${label}: uncaught error: ${error.message}`)
  );
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !message.text().startsWith('Failed to load resource')
    ) {
      problems.push(`${label}: console error: ${message.text()}`);
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      problems.push(
        `${label}: HTTP ${response.status()} ${response.url().replace(baseUrl, '')}`
      );
    }
  });
  page.on('requestfailed', (request) => {
    const errorText = request.failure()?.errorText ?? '';
    if (!errorText.includes('ERR_ABORTED')) {
      problems.push(
        `${label}: request failed ${request.url().replace(baseUrl, '')} ${errorText}`
      );
    }
  });
  return page;
};

/** Loads a demo and waits for its graph. Returns an error message, or undefined when the demo rendered. */
const loadDemo = async (page, id) => {
  await page.goto(`${baseUrl}/#/${id}`);
  await page.waitForFunction(
    (demoId) => window.__showcase?.currentDemoId === demoId,
    id,
    {
      timeout: renderTimeoutInMs,
    }
  );
  const mountError = await page.evaluate(() => window.__showcase.mountError);
  if (mountError) return `mount error: ${mountError}`;
  const rendered = await page
    .locator('#stage svg')
    .first()
    .waitFor({ timeout: renderTimeoutInMs })
    .then(
      () => true,
      () => false
    );
  return rendered ? undefined : 'no SVG rendered';
};

let server;
let browser;
const problems = [];
const results = [];
try {
  server = await startServer();
  browser = await launchBrowser();
  console.log(`browser: Chrome ${browser.version()}, server: ${baseUrl}`);

  const probe = await openPage(browser, 'startup', problems);
  await probe.goto(baseUrl);
  await probe.waitForFunction(() => window.__showcase?.currentDemoId, null, {
    timeout: renderTimeoutInMs,
  });
  const demoIds = await probe.evaluate(() => window.__showcase.demoIds);
  await probe.context().close();

  // 1. every demo renders, without any error
  for (const id of demoIds) {
    const page = await openPage(browser, id, problems);
    try {
      const error = await loadDemo(page, id);
      results.push({ name: `render ${id}`, error });
    } catch (error) {
      results.push({ name: `render ${id}`, error: error.message.split('\n')[0] });
    } finally {
      await page.context().close();
    }
  }

  // 2. behaviour scenarios, each on its own page
  for (const [name, scenario] of Object.entries(scenarios)) {
    const page = await openPage(browser, name, problems);
    try {
      await scenario({ page, loadDemo: (id) => loadDemo(page, id), demoIds });
      results.push({ name });
    } catch (error) {
      results.push({ name, error: error.message.split('\n')[0] });
    } finally {
      await page.context().close();
    }
  }
} catch (error) {
  fail(error.message);
} finally {
  await browser?.close();
  server?.kill();
}

const failures = results.filter((result) => result.error);
for (const result of results) {
  console.log(
    `${result.error ? 'FAIL' : 'ok  '} ${result.name}${result.error ? `: ${result.error}` : ''}`
  );
}
console.log(
  `\n${results.length - failures.length}/${results.length} checks passed, ${problems.length} problem(s)`
);
for (const problem of problems) console.log(`  ${problem}`);
if (failures.length + problems.length > 0) process.exitCode = 1;
console.log(process.exitCode ? 'FAIL' : 'PASS');
