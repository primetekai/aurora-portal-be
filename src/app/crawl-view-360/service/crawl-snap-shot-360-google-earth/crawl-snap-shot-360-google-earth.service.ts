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
  zoom: number = 4,
): Promise<string> => {
  const browser = await puppeteer.launch({
    // executablePath: '/usr/bin/chromium-browser',
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: false,
    protocolTimeout: 120_000,
    defaultViewport: { width: 1920, height: 1080 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      // '--disable-gpu',
      '--ozone-platform=wayland',
      '--enable-features=UseOzonePlatform,VaapiVideoDecoder',
      '--window-size=1920,1080',
    ],
    env: {
      WAYLAND_DISPLAY: 'wayland-0',
      XDG_SESSION_TYPE: 'wayland',
    },
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(120_000);
  page.setDefaultNavigationTimeout(120_000);
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

    const [canvasWidth, canvasHeight] = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return [canvas?.width, canvas?.height];
    });
    console.log('🖼️ Canvas size:', canvasWidth, canvasHeight);

    // Tắt animation/transition để khung hình ổn định
    await page.addStyleTag({
      content: `* { animation: none !important; transition: none !important; }`,
    });

    //Click close modal
    await clickXY(page, 1163, 318);
    await delay(1_000);
    await clickMultiple(page, 1886, 30, 2);
    await delay(1_000);

    // Click vào ô search và nhập địa điểm
    await clickMultiple(page, 200, 56, 2);
    await delay(1_000);
    await page.keyboard.type(location, { delay: 100 });
    await page.keyboard.press('Enter');
    await delay(10_000);

    // Tối ưu UI (zoom, rotate)
    await clickXY(page, 880, 1015);
    await clickXY(page, 55, 150);
    await clickXY(page, 581, 32);
    await delay(1_000);

    // Zoom thêm nếu cần
    await clickMultiple(page, 1884, 1014, zoom);
    await delay(1_000);

    // Click map pin
    await clickMultiple(page, 1882, 126, 1); //Click close map pin
    await delay(1_000);

    // Click close modal
    await clickXY(page, 1260, 856);
    await delay(1_000);

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

async function captureFramesWithScreencast(
  page: Page,
  durationSec: number,
  fps: number,
): Promise<string> {
  const framesDir = path.join(__dirname, 'frames');
  await fs.emptyDir(framesDir);

  const client: CDPSession = await page.target().createCDPSession();
  let frameCount = 0;
  const totalFrames = durationSec * fps;

  // Thiết lập listener, chỉ ack và ghi file
  client.on('Page.screencastFrame', async ({ data, sessionId }) => {
    if (frameCount < totalFrames) {
      const img = Buffer.from(data, 'base64');
      const filePath = path.join(
        framesDir,
        `frame-${String(frameCount).padStart(4, '0')}.jpg`,
      );
      await fs.writeFile(filePath, img);
      frameCount++;

      // Bọc ACK trong try/catch để ignore nếu target đã đóng
      try {
        await client.send('Page.screencastFrameAck', { sessionId });
      } catch (e) {
        // ignore
      }
    }
  });

  // Bắt đầu screencast
  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 95,
    maxWidth: 1920,
    maxHeight: 1080,
    everyNthFrame: Math.max(1, Math.floor(60 / fps)),
  });

  // Chờ đủ duration rồi mới stop
  await delay(durationSec * 1000);
  try {
    await client.send('Page.stopScreencast');
  } catch (e) {
    // ignore nếu target đã đóng trước
  }

  return framesDir;
}

function convertImagesToVideo(framesDir: string): Promise<string> {
  const fileName = `${uuidv4()}.mp4`;
  const videoPath = path.join(__dirname, fileName);
  const vf = 'crop=iw:floor(ih*0.8/2)*2:0:floor(ih*0.1/2)*2';

  const cmd =
    `ffmpeg -framerate 10 ` +
    `-i "${path.join(framesDir, 'frame-%04d.jpg')}" ` +
    `-vf "${vf}" ` +
    `-c:v libx264 -crf 18 -preset veryfast -pix_fmt yuv420p ` +
    `"${videoPath}"`;

  return new Promise((resolve, reject) => {
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

// Helpers
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
