const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const staticDir = path.resolve(__dirname, '..', 'static');
const outDir = path.resolve(__dirname, '..', '..', 'docs', 'images');

// Simple static server using Node
const server = http.createServer((req, res) => {
  let filePath = path.join(staticDir, req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(filePath)) filePath = path.join(staticDir, 'index.html');
  
  const ext = path.extname(filePath);
  const contentType = ext === '.css' ? 'text/css' : ext === '.js' ? 'application/javascript' : 'text/html';
  
  res.writeHead(200, { 'Content-Type': contentType });
  res.end(fs.readFileSync(filePath));
});

server.listen(8006, async () => {
  console.log('Node static server running on port 8006');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  
  await page.goto('http://localhost:8006');
  await page.waitForTimeout(1000);
  
  // 1. Capture Main Studio Screenshot
  await page.screenshot({ path: path.join(outDir, 'web_designer_studio.jpg') });
  console.log('Captured real Main Studio screenshot!');

  // 2. Click Settings button and capture Settings Modal
  await page.click('button:has-text("Driver:")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'connection_settings_modal.jpg') });
  console.log('Captured real Settings Modal screenshot!');

  // Close Settings modal
  await page.click('button:has-text("Cancel")');
  await page.waitForTimeout(300);

  // 3. Click Preview button and capture Preview Modal
  await page.click('button:has-text("Preview")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'thermal_preview_modal.jpg') });
  console.log('Captured real Preview Modal screenshot!');

  await browser.close();
  server.close();
  process.exit(0);
});
