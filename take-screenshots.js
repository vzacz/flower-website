const puppeteer = require('./node_modules/puppeteer');
(async () => {
  const b = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1400, height: 900 });
  await p.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 25000 });
  await p.evaluate(() => {
    document.querySelectorAll('.product-card img').forEach(i => { i.loading = 'eager'; });
    document.querySelectorAll('.reveal,.stagger-item').forEach(e => e.classList.add('revealed'));
  });
  await new Promise(r => setTimeout(r, 10000));
  await p.evaluate(() => window.scrollTo(0, 2300));
  await new Promise(r => setTimeout(r, 300));
  await p.screenshot({ path: 'temporary_screenshots/final-peonies.png' });
  await p.evaluate(() => window.scrollTo(0, 3100));
  await new Promise(r => setTimeout(r, 300));
  await p.screenshot({ path: 'temporary_screenshots/final-hydrangeas.png' });
  await b.close();
  console.log('Screenshots saved');
})().catch(e => { console.error(e.message); process.exit(1); });
