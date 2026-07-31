const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const staticDir = path.resolve(__dirname, '..', 'static');
const outDir = path.resolve(__dirname, '..', '..', 'docs', 'images');

const server = http.createServer((req, res) => {
  let filePath = path.join(staticDir, req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(filePath)) filePath = path.join(staticDir, 'index.html');
  
  const ext = path.extname(filePath);
  const contentType = ext === '.css' ? 'text/css' : ext === '.js' ? 'application/javascript' : 'text/html';
  
  res.writeHead(200, { 'Content-Type': contentType });
  res.end(fs.readFileSync(filePath));
});

server.listen(8012, async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  
  await page.goto('http://localhost:8012');
  await page.waitForTimeout(1500);
  
  // 1. Capture Main Studio Screenshot
  await page.screenshot({ path: path.join(outDir, 'web_designer_studio.jpg') });
  console.log('1. Captured Main Studio!');

  // 2. Open Connection Wizard and go to Settings Modal
  // Click the "Server Bridge" toggle tab in the header
  await page.click('button:has-text("Server Bridge")');
  await page.waitForTimeout(400);
  await page.click('button:has-text("Configure Bridge")');
  await page.waitForTimeout(600);
  await page.click('button:has-text("Switch to Server Bridge Mode")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, 'connection_settings_modal.jpg') });
  console.log('2. Captured Settings Modal!');

  // Close Settings modal
  await page.click('button:has-text("Cancel")');
  await page.waitForTimeout(600);

  // 3. Click Preview button and capture Preview Modal
  await page.click('button:has-text("Preview Print Output")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'thermal_preview_modal.jpg') });
  console.log('3. Captured Thermal Preview Modal!');

  await browser.close();
  server.close();
  process.exit(0);
});
