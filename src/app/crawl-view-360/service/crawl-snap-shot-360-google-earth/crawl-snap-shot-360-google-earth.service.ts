import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs-extra';
import { exec } from 'child_process';
import path from 'path';
import type { Page } from 'puppeteer';

puppeteer.use(StealthPlugin());

export const captureGoogleEarth = async (location: string): Promise<string> => {
  const browser = await puppeteer.launch({
    headless: false, // Cần bật UI để quay video
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
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

  try {
    console.log(`🔍 Opening Google Earth...`);

    await page.goto('https://earth.google.com/web/', {
      waitUntil: 'networkidle2',
    });

    await delay(5000);
    await clickSearchInput(page);
    await page.keyboard.type(location, { delay: 100 });
    await page.keyboard.press('Enter');

    await delay(5000);
    console.log('🔄 Reloading Google Earth Web...');
    await page.reload({ waitUntil: 'networkidle2' });

    await delay(1000);
    await clickButtonUI(page, 880, 1015);
    await delay(1000);
    await zoomIn(page, 350);

    await delay(1000);
    await page.reload({ waitUntil: 'networkidle2' });

    await delay(1000);
    await doubleClickButtonUI(page, 1750, 1010);
    await delay(1000);

    console.log('🎥 Recording screenshots for 50 seconds...');
    const framesDir = await captureFrames(page, 50);

    console.log('🎞 Converting images to video...');
    const videoPath = await convertImagesToVideo(framesDir);

    console.log('📤 Converting video to Base64...');
    const base64Video = await convertToBase64(videoPath);

    await browser.close();
    return base64Video;
  } catch (error) {
    console.error('❌ Error capturing Google Earth video:', error);
    await browser.close();
    throw error;
  }
};

const captureFrames = async (page: Page, duration: number): Promise<string> => {
  const framesDir = path.join(__dirname, 'frames');
  await fs.ensureDir(framesDir);

  const frameRate = 5; // Chụp 5 ảnh mỗi giây
  const totalFrames = duration * frameRate;

  for (let i = 0; i < totalFrames; i++) {
    const filePath = path.join(
      framesDir,
      `frame-${String(i).padStart(4, '0')}.jpg`,
    );
    await page.screenshot({ path: filePath, type: 'jpeg' });
    await delay(1000 / frameRate); // Đợi trước khi chụp tiếp
  }

  return framesDir;
};

const convertImagesToVideo = async (framesDir: string): Promise<string> => {
  const videoPath = path.join(__dirname, 'output.mp4');

  return new Promise((resolve, reject) => {
    const ffmpegCommand = `ffmpeg -framerate 5 -i ${framesDir}/frame-%04d.jpg -c:v libx264 -pix_fmt yuv420p ${videoPath}`;

    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ FFmpeg error: ${stderr}`);
        reject(error);
      } else {
        console.log('✅ Video created successfully');
        resolve(videoPath);
      }
    });
  });
};

const convertToBase64 = async (filePath: string): Promise<string> => {
  const fileData = await fs.readFile(filePath);
  return fileData.toString('base64');
};

const clickSearchInput = async (page: Page) => {
  console.log('🖱️ Clicking on the search input...');
  const x = 185;
  const y = 32;
  await page.mouse.click(x, y);
  console.log(`✅ Clicked on search input at: (${x}, ${y})`);
};

const clickButtonUI = async (page: Page, x: number, y: number) => {
  console.log(`🖱️ Clicking at (${x}, ${y})...`);
  await page.mouse.click(x, y, { delay: 150 });
};

const doubleClickButtonUI = async (page: Page, x: number, y: number) => {
  console.log(`🖱️ Double clicking at (${x}, ${y})...`);
  await page.mouse.click(x, y, { clickCount: 2, delay: 100 });
};

const zoomIn = async (page: Page, number: number) => {
  await page.mouse.wheel({ deltaY: number });
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
