import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs-extra';
import { exec } from 'child_process';
import path from 'path';
import type { Page, CDPSession } from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';

puppeteer.use(StealthPlugin());

export const captureGoogleEarth = async (
  location: string,
  zoom: number = 2,
): Promise<string> => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    // executablePath:
    //   '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: false,
    protocolTimeout: 120_000,
    defaultViewport: { width: 1920, height: 1080 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ozone-platform=wayland',
      '--enable-features=UseOzonePlatform,VaapiVideoDecoder',
    ],
    env: {
      WAYLAND_DISPLAY: 'wayland-0',
      XDG_SESSION_TYPE: 'wayland',
    },
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(120_000);
  page.setDefaultNavigationTimeout(120_000);

  // Tắt animation/transition để khung hình ổn định
  await page.addStyleTag({
    content: `* { animation: none !important; transition: none !important; }`,
  });

  await page.setUserAgent(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  );

  try {
    console.log('🔍 Opening Google Earth...');
    await page.goto('https://earth.google.com/web/', {
      waitUntil: 'networkidle2',
      timeout: 0,
    });
    await page.reload({ waitUntil: 'networkidle2' });

    await page.waitForFunction(
      () => {
        const canvas = document.querySelector('canvas');
        return !!canvas && (canvas as HTMLCanvasElement).width > 0;
      },
      { timeout: 30_000 },
    );
    console.log('🌍 Canvas ready!');

    // click vào ô search
    await clickXY(page, 185, 32);
    await delay(1_000);

    // nhập location và enter
    await page.keyboard.type(location, { delay: 100 });
    await page.keyboard.press('Enter');
    await delay(10_000);

    // click các nút UI để zoom/rotate
    await clickXY(page, 880, 1015);
    await clickXY(page, 55, 150);
    await clickXY(page, 581, 32);
    await delay(1_000);

    // Zoom in
    if (zoom !== 1) {
      await clickMultiple(page, 1884, 1014, zoom);
      await delay(1_000);
    }
    // Rotate
    await clickMultiple(page, 1750, 1010, 1);
    await delay(2_000);

    console.log('🎥 Recording frames for 20s at 10fps...');
    const framesDir = await captureFramesWithScreencast(page, 20, 10);

    console.log('🎞 Converting to video...');
    const videoPath = await convertImagesToVideo(framesDir);

    await page.close();
    await browser.close();

    console.log('✅ Video saved at:', videoPath);
    return videoPath;
  } catch (err) {
    console.error('❌ Error capturing Google Earth video:', err);
    await browser.close();
    throw err;
  }
};

// Dùng CDP Screencast để capture frames
async function captureFramesWithScreencast(
  page: Page,
  durationSec: number,
  fps: number,
): Promise<string> {
  const framesDir = path.join(__dirname, 'frames');
  await fs.emptyDir(framesDir);

  // Tạo CDP session
  const client: CDPSession = await page.target().createCDPSession();

  let frameCount = 0;
  const totalFrames = durationSec * fps;

  client.on('Page.screencastFrame', async ({ data, sessionId }) => {
    if (frameCount < totalFrames) {
      const img = Buffer.from(data, 'base64');
      const filePath = path.join(
        framesDir,
        `frame-${String(frameCount).padStart(4, '0')}.jpg`,
      );
      await fs.writeFile(filePath, img);
      frameCount++;
      await client.send('Page.screencastFrameAck', { sessionId });
    } else {
      await client.send('Page.stopScreencast');
    }
  });

  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 80,
    maxWidth: 1920,
    maxHeight: 1080,
    everyNthFrame: Math.max(1, Math.floor(60 / fps)),
  });

  // Chờ đủ thời gian quay
  await delay(durationSec * 1000);

  return framesDir;
}

// Chuyển frames thành video bằng ffmpeg
function convertImagesToVideo(framesDir: string): Promise<string> {
  const fileName = `${uuidv4()}.mp4`;
  const videoPath = path.join(__dirname, fileName);

  return new Promise((resolve, reject) => {
    const cmd = [
      'ffmpeg',
      '-framerate',
      '10',
      '-i',
      `${framesDir}/frame-%04d.jpg`,
      '-vf',
      'crop=in_w:in_h*0.65:0:in_h*0.25',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      videoPath,
    ].join(' ');

    exec(cmd, (err, _stdout, stderr) => {
      if (err) {
        console.error('❌ FFmpeg error:', stderr);
        return reject(err);
      }
      console.log('✅ Video created:', videoPath);
      resolve(videoPath);
    });
  });
}

// helpers
async function clickXY(page: Page, x: number, y: number) {
  console.log(`🖱️ Clicking at (${x},${y})`);
  await page.mouse.click(x, y, { delay: 100 });
}

async function clickMultiple(page: Page, x: number, y: number, count: number) {
  for (let i = 0; i < count; i++) {
    await page.mouse.click(x, y, { delay: 100 });
    await delay(300);
  }
  console.log(`✅ Clicked ${count} times at (${x},${y})`);
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
