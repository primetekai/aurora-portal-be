import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs-extra';
import { exec } from 'child_process';
import path from 'path';
import type { Page } from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import { IVideoMetadata } from './capture-google-earth.type';

puppeteer.use(StealthPlugin());

export const captureGoogleEarth = async (
  location: string,
  zoom?: number,
): Promise<IVideoMetadata> => {
  console.log('🖥️  DISPLAY =', process.env.DISPLAY);

  const browser = await puppeteer.connect({
    browserWSEndpoint: process.env.BROWSERLESS_WS || 'ws://127.0.0.1:5011',
  });

  // const browser = await puppeteer.launch({
  //   // executablePath: puppeteer.executablePath(), // ✅ Lấy đúng path tự động
  //   // executablePath: '/usr/bin/chromium-browser',
  //   executablePath: '/usr/bin/google-chrome',
  //   // executablePath:
  //   //   '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  //   headless: false,
  //   defaultViewport: {
  //     width: 1920,
  //     height: 1080,
  //   },
  //   args: [
  //     '--no-sandbox',
  //     '--disable-setuid-sandbox',
  //     // '--disable-gpu',
  //     // '--ozone-platform=wayland',
  //     '--enable-webgl',
  //     '--ignore-gpu-blocklist',
  //     '--use-gl=egl',
  //     '--enable-gpu-compositing',
  //     '--enable-zero-copy',
  //     '--window-size=1920,1080',
  //   ],
  //   // env: {
  //   //   DISPLAY: ':0',
  //   //   WAYLAND_DISPLAY: 'wayland-0',
  //   //   XDG_SESSION_TYPE: 'wayland',
  //   // },
  // });

  const page = await browser.newPage();

  await page.setViewport({
    width: 1920,
    height: 1080,
  });

  await page.setUserAgent(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  );

  try {
    console.log(`🔍 Opening Google Earth...`);

    await page.goto('https://earth.google.com/web/', {
      waitUntil: 'networkidle2',
      timeout: 0,
    });

    await delay(1000);

    await page.reload({ waitUntil: 'networkidle2' });

    await delay(5000);

    await clickSearchInput(page);

    await delay(1000);

    await page.keyboard.type(location, { delay: 100 });

    await page.keyboard.press('Enter');

    await delay(10000);

    await page.reload({ waitUntil: 'networkidle2' });

    await delay(1000);

    await clickButtonUI(page, 880, 1015);

    await clickButtonUI(page, 55, 150);

    await page.reload({ waitUntil: 'networkidle2' });

    await delay(1000);

    await delay(1000);

    //Zoom in
    await clickMultipleTimes(page, 1884, 1014, zoom);

    await delay(1000);

    await clickMultipleTimes(page, 1750, 1010, 1);

    await delay(1000);

    console.log('🎥 Recording screenshot videos 1 for 40 seconds...');

    const framesDir = await captureFrames(page, 20);

    console.log('🎞 Converting images to video...');

    const videoMetadata = await convertImagesToVideo(framesDir);

    await delay(1000);

    await browser.close();

    return videoMetadata;
  } catch (error) {
    console.error('❌ Error capturing Google Earth video:', error);
    await browser.close();
    throw error;
  }
};

const captureFrames = async (page: Page, duration: number): Promise<string> => {
  const framesDir = path.join(__dirname, 'frames');
  await fs.ensureDir(framesDir);

  const frameRate = 10; // Capture 5 frames per second
  const totalFrames = duration * frameRate;

  console.log(`Starting to capture ${totalFrames} frames.`);
  try {
    for (let i = 0; i < totalFrames; i++) {
      const filePath = path.join(
        framesDir,
        `frame-${String(i).padStart(4, '0')}.jpg`,
      );
      await page.screenshot({ path: filePath, type: 'jpeg' });
      console.log(`Captured frame ${i + 1}/${totalFrames}`);
      await delay(1000 / frameRate); // Wait before capturing the next frame
    }
  } catch (error) {
    console.error('Error during frame capture:', error);
    throw error;
  }
  console.log('All frames captured successfully.');

  return framesDir;
};

const convertImagesToVideo = async (
  framesDir: string,
): Promise<IVideoMetadata> => {
  const videoFileName = `${uuidv4()}.mp4`;
  const videoPath = path.join(__dirname, videoFileName);

  // Calculate duration and frames from the directory
  const files = await fs.readdir(framesDir);
  const totalFrames = files.length;
  const duration = Math.ceil(totalFrames / 5); // assuming 5 fps

  return new Promise((resolve, reject) => {
    const ffmpegCommand = `
    ffmpeg -framerate 5 -i ${framesDir}/frame-%04d.jpg \
    -vf "crop=in_w:in_h*0.8:0:in_h*0.1" \
    -c:v libx264 -pix_fmt yuv420p ${videoPath}
    `;

    exec(ffmpegCommand, async (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ FFmpeg error: ${stderr}`);
        reject(error);
        return;
      }

      try {
        // Get video file stats
        const stats = await fs.stat(videoPath);
        const fileSizeInBytes = stats.size;
        const fileSizeInMB = Number(
          (fileSizeInBytes / (1024 * 1024)).toFixed(2),
        );

        const metadata: IVideoMetadata = {
          videoPath,
          size: {
            bytes: fileSizeInBytes,
            megabytes: fileSizeInMB,
          },
          duration,
          frameCount: totalFrames,
        };

        console.log(`✅ Video created successfully:`);
        console.log(`📍 Path: ${metadata.videoPath}`);
        console.log(`📊 Size: ${metadata.size.megabytes} MB`);
        console.log(`⏱️ Duration: ${metadata.duration} seconds`);
        console.log(`🎞️ Frame count: ${metadata.frameCount}`);

        // Check if file size is reasonable
        if (fileSizeInBytes === 0) {
          throw new Error('Generated video file is empty');
        }

        resolve(metadata);
      } catch (statError) {
        console.error('❌ Error checking video file:', statError);
        reject(statError);
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

  await page.mouse.click(x, y, { delay: 100 });

  console.log(`✅ Clicked on search input at: (${x}, ${y})`);
};

const clickButtonUI = async (page: Page, x: number, y: number) => {
  console.log(`🖱️ Clicking at (${x}, ${y})...`);

  await page.mouse.click(x, y, { delay: 100 });
};

// Rotate
const doubleClickButtonUI = async (page: Page, x: number, y: number) => {
  console.log(`🖱️ Double clicking at (${x}, ${y})...`);

  await page.mouse.click(x, y, { clickCount: 2, delay: 100 });
};

const zoomMap = async (page: Page, number: number) => {
  for (let i = 0; i < number; i++) {
    await page.mouse.wheel({ deltaY: 100 * number });
    await delay(200);
  }
};

//Zoom in
const clickMultipleTimes = async (
  page: Page,
  x: number,
  y: number,
  count: number,
) => {
  console.log(`🖱️ Clicking at (${x}, ${y}) ${count} times...`);

  for (let i = 0; i < count; i++) {
    await page.mouse.click(x, y, { delay: 100 }); // Add delay to prevent clicking too fast
    await delay(1000); // Wait a bit between clicks
  }
  console.log(`✅ Finished clicking ${count} times at (${x}, ${y})`);
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
