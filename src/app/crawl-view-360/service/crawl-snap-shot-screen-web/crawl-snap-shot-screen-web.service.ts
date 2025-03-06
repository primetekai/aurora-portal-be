import puppeteer from 'puppeteer-extra';
import { default as StealthPlugin } from 'puppeteer-extra-plugin-stealth';
import type { Page, WaitForOptions } from 'puppeteer';

puppeteer.use(StealthPlugin());

export const crawlSnapShotScreenWebService = async (
  url: string,
  source?: string,
): Promise<any> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--ignore-certificate-errors',
    ],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
  );

  if (source === 'facebook') {
    await safeGoto(page, url, {
      waitUntil: 'networkidle0',
      timeout: 10000,
    });

    const closeButtonSelector = 'div[aria-label="Close"][role="button"]';

    await page.waitForSelector(closeButtonSelector, { visible: true });

    await page.click(closeButtonSelector);

    await page.evaluate(() => {
      const popup = document.querySelector('div[data-nosnippet]');
      if (popup) {
        popup.remove();
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
  } else if (source === 'tiktok') {
    await safeGoto(page, url, {
      waitUntil: 'networkidle0',
      timeout: 10000,
    });

    const closeButtonSelector = 'button[aria-label="Close"][role="button"]';

    await page.waitForSelector(closeButtonSelector, { visible: true });

    await page.click(closeButtonSelector);

    await new Promise((resolve) => setTimeout(resolve, 100));
  } else {
    await safeGoto(page, url, {
      waitUntil: 'networkidle0',
      timeout: 10000,
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const base64Image: string = await page.screenshot({
    fullPage: true,
    encoding: 'base64',
  });

  await browser.close();

  return base64Image;
};

export const safeGoto = async (
  page: Page,
  url: string,
  options: WaitForOptions,
): Promise<void> => {
  for (let i = 0; i < 3; i++) {
    try {
      console.log(`Attempt ${i + 1}: Navigating to ${url}`);
      await page.goto(url, options);
      return;
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed: ${error.message}`);
      if (i === 2) {
        console.error('Final attempt failed. Throwing error.');
      }
    }
  }
  throw new Error('Failed to load page after 3 attempts');
};
