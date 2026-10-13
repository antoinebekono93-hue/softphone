const { chromium } = require('C:/Users/Antoine/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, timeout:60000});
  try {
  console.log('BROWSER_LAUNCHED', browser.version());
  const page = await browser.newPage({viewport:{width:390,height:844}});
  const response = await page.goto('http://127.0.0.1:3001', {waitUntil:'domcontentloaded',timeout:90000});
  console.log(JSON.stringify({status:response.status(),title:await page.title(),dimensions:await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}))}));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e.message);process.exitCode=1});
