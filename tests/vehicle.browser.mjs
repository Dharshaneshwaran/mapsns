import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
const browser = await chromium.launch({headless:true, executablePath:process.env.TEST_BROWSER_PATH});
try {
 const context = await browser.newContext({geolocation:{latitude:11.1005,longitude:77.0265,accuracy:5},permissions:['geolocation']});
 const page = await context.newPage();
 const errors = [];
 page.on('pageerror', e=>errors.push(e.message));
 await page.route('https://routing.openstreetmap.de/**', r=>r.fulfill({json:{code:'Ok',routes:[{distance:200,duration:100,geometry:{coordinates:[[77.0265,11.1005],[77.026641,11.100094]]}}]}}));
 await page.goto(`${base}/?place=admin-building`);
 await page.waitForFunction(() => Boolean(window.google?.maps));
 await page.getByText('Loading campus map...', {exact:true}).waitFor({state:'hidden'});
 await page.waitForFunction(() => Boolean(document.querySelector('.gm-style')));
 await page.getByRole('button',{name:'Directions',exact:true}).click();
 await page.getByRole('button',{name:'Vehicle',exact:true}).click();
 await page.getByRole('button',{name:'Start',exact:true}).click();
 await page.waitForTimeout(1500);
 const cart = page.getByAltText('Bullet cart', {exact:true});
 await cart.waitFor({state:'visible'});
 assert.ok(await cart.evaluate(i=>i.complete && i.naturalWidth > 0));
 for (const viewport of [{width:1280,height:720},{width:390,height:844}]) {
   await page.setViewportSize(viewport);
   await page.getByRole('button',{name:'Recenter on my location'}).click();
   await page.waitForTimeout(600);
   const bounds = await cart.boundingBox();
   assert.ok(bounds && bounds.width >= 112 && bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width && bounds.y + bounds.height <= viewport.height);
 }
 assert.deepEqual(errors, []);
 console.log('PASS: vehicle cart loads and remains visible while stationary on desktop and mobile.');
} finally {await browser.close();}
