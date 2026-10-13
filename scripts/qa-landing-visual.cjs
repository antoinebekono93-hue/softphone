const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Antoine/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const sizes = [[320,568],[360,800],[375,667],[390,844],[393,852],[412,915],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
const run = process.argv[2] || 'baseline';
const output = path.resolve('docs/qa/landing', run);
fs.mkdirSync(output, {recursive:true});

(async () => {
  const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,timeout:60000});
  const results = {date:new Date().toISOString(), browser:browser.version(), url:'http://127.0.0.1:3001', reducedMotion:true, viewports:[], errors:[]};
  try {
    const context = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,reducedMotion:'reduce'});
    const page = await context.newPage();
    page.on('pageerror', error => results.errors.push(error.message));
    const response = await page.goto(results.url,{waitUntil:'domcontentloaded',timeout:120000});
    if (response.status() !== 200) throw new Error(`Landing HTTP ${response.status()}`);
    await page.locator('.landing-page').waitFor({timeout:120000});
    await page.evaluate(() => document.fonts.ready);
    for (const [width,height] of sizes) {
      await page.setViewportSize({width,height});
      await page.evaluate(()=>window.scrollTo(0,0));
      await page.waitForTimeout(250);
      const prefix = `${width}x${height}`;
      const record = await page.evaluate(() => {
        const rect = element => {const r=element.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
        const title=document.querySelector('h1');
        const cta=document.querySelector('.landing-hero-actions a');
        const menu=document.querySelector('[aria-controls="marketing-mobile-menu"]');
        const visible=el=>!!el.getClientRects().length && getComputedStyle(el).visibility!=='hidden';
        const overflowing=[...document.querySelectorAll('.landing-page *')].filter(el=>visible(el)&&!el.closest('[aria-hidden="true"]')&&getComputedStyle(el).position!=='absolute').filter(el=>{const r=el.getBoundingClientRect();return r.right>innerWidth+1||r.left < -1}).map(el=>({tag:el.tagName,class:el.className,text:el.textContent.trim().slice(0,90),rect:rect(el)}));
        const clipped=[...document.querySelectorAll('.landing-card, .landing-selectors button, .landing-button, .marketing-register, .marketing-footer-link')].filter(visible).filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>({class:el.className,text:el.textContent.trim().slice(0,90),scrollWidth:el.scrollWidth,clientWidth:el.clientWidth}));
        return {scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,title:rect(title),titleFont:getComputedStyle(title).fontSize,titleLines:Math.round(title.getBoundingClientRect().height/parseFloat(getComputedStyle(title).lineHeight)),primaryCTA:rect(cta),header:rect(document.querySelector('header')),menu:rect(menu),overflowing,clipped,viewportMeta:document.querySelector('meta[name="viewport"]').content};
      });
      Object.assign(record,{width,height,tested:true,screenshots:[]});
      async function capture(name, locator) {
        const file=`${prefix}-${name}.png`;
        if (locator) await locator.screenshot({path:path.join(output,file),animations:'disabled',timeout:30000});
        else await page.screenshot({path:path.join(output,file),animations:'disabled'});
        record.screenshots.push(file);
      }
      await capture('hero');
      await page.locator('.landing-trust-bar').evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+scrollY-innerHeight*.45));
      await capture('hero-trust');
      await capture('features',page.locator('#features'));
      await capture('stats',page.locator('.landing-stats-grid').locator('xpath=ancestor::section[1]'));
      await capture('use-cases',page.locator('section').filter({has:page.getByRole('heading',{name:/Cas d.usage concrets/})}));
      await capture('final-cta',page.locator('.landing-final-cta'));
      await capture('footer',page.locator('footer'));
      const full=`${prefix}-full.png`;
      await page.screenshot({path:path.join(output,full),fullPage:true,animations:'disabled'});
      record.screenshots.push(full);
      if (width<1280) {
        await page.evaluate(()=>window.scrollTo(0,0));
        const button=page.getByRole('button',{name:'Ouvrir le menu'});
        await button.click();
        const drawer=page.locator('#marketing-mobile-menu');
        await drawer.waitFor({state:'visible'});
        record.drawer=await drawer.evaluate(el=>({scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,bodyLocked:document.body.style.overflow==='hidden',bottom:el.getBoundingClientRect().bottom,viewportHeight:innerHeight}));
        await capture('menu');
        await drawer.evaluate(el=>{el.scrollTop=el.scrollHeight});
        record.drawer.reachedBottom=await drawer.evaluate(el=>el.scrollTop+el.clientHeight>=el.scrollHeight-1);
        await page.keyboard.press('Escape');
        record.drawer.escapeClosed=await drawer.getAttribute('aria-hidden')==='true';
        record.drawer.focusRestored=await button.evaluate(el=>document.activeElement===el);
        record.drawer.focusOutline=await button.evaluate(el=>({style:getComputedStyle(el).outlineStyle,width:getComputedStyle(el).outlineWidth,visible:el.matches(':focus-visible')}));
        await button.click();
        const bottom=await drawer.evaluate(el=>el.getBoundingClientRect().bottom);
        if (bottom<height-5) {
          await page.mouse.click(5,height-3);
          record.drawer.overlayClosed=await drawer.getAttribute('aria-hidden')==='true';
        } else record.drawer.overlayClosed='not-exposed-at-this-height';
        if (await drawer.getAttribute('aria-hidden')==='false') await page.keyboard.press('Escape');
      }
      results.viewports.push(record);
      fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
      console.log(JSON.stringify({size:prefix,scrollWidth:record.scrollWidth,clientWidth:record.clientWidth,titleLines:record.titleLines,clipped:record.clipped.length,drawer:record.drawer}));
    }
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>document.documentElement.setAttribute('data-theme','light'));
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:path.join(output,'390-light-hero.png'),animations:'disabled'});
    await page.screenshot({path:path.join(output,'390-light-full.png'),fullPage:true,animations:'disabled'});
    await context.close();
  } finally {
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
    await browser.close();
  }
})().catch(error=>{console.error(error.stack);process.exitCode=1});
