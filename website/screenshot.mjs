import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'temporary_screenshots');

// Ensure the output directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Args: <url> [label]
const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

// Find next available screenshot-N[-label].png
function nextFilename(label) {
  let n = 1;
  while (true) {
    const name = label
      ? `screenshot-${n}-${label}.png`
      : `screenshot-${n}.png`;
    if (!fs.existsSync(path.join(SCREENSHOTS_DIR, name))) return name;
    n++;
  }
}

const filename = nextFilename(label);
const outPath  = path.join(SCREENSHOTS_DIR, filename);

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: outPath, fullPage: true });
  await browser.close();

  console.log(`Screenshot saved: ${outPath}`);
})();
