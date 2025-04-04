import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs-extra';
import { exec } from 'child_process';
import path from 'path';
import type { Page } from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
// import { spawn } from 'child_process';

puppeteer.use(StealthPlugin());

export const captureGoogleEarth = async (
  location: string,
  zoom?: number,
): Promise<string> => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    // executablePath:
    //   '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: false,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ozone-platform=wayland',
      '--enable-features=UseOzonePlatform',
      '--enable-features=VaapiVideoDecoder',
    ],
    env: {
      WAYLAND_DISPLAY: 'wayland-0',
      XDG_SESSION_TYPE: 'wayland',
    },
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  );

  try {
    console.log(`🔍 Opening Google Earth...`);

    await page.goto('https://earth.google.com/web/', {
      waitUntil: 'networkidle2',
      timeout: 0,
    });

    await page.reload({ waitUntil: 'networkidle2' });

    await delay(3000);

    await page.mouse.move(100, 100);
    await page.mouse.move(200, 200);
    await page.mouse.click(500, 500);

    await page.waitForFunction(
      () => {
        const canvas = document.querySelector('canvas');
        return canvas && canvas.clientHeight > 0 && canvas.clientWidth > 0;
      },
      { timeout: 20000 },
    );

    console.log('🌍 Google Earth canvas ready!');

    await clickSearchInput(page);

    await delay(1000);

    await page.keyboard.type(location, { delay: 100 });

    await page.keyboard.press('Enter');

    await delay(10000);

    await clickButtonUI(page, 880, 1015);

    await clickButtonUI(page, 55, 150);

    await clickButtonUI(page, 581, 32);

    await clickButtonUI(page, 1880, 102);

    await delay(1000);

    // await clickMultipleTimes(page, 1670, 1010, 1);

    // await page.evaluate(() => {
    //   const icon = document.createElement('div');
    //   icon.id = 'location-icon';
    //   icon.innerHTML = `
    //     <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="red">
    //       <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0
    //         9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5
    //         2.5-2.5 2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
    //     </svg>
    //   `;
    //   icon.style.position = 'fixed';
    //   icon.style.top = '50%';
    //   icon.style.left = '50%';
    //   icon.style.transform = 'translate(-50%, -50%)';
    //   icon.style.zIndex = '999999';
    //   icon.style.pointerEvents = 'none';
    //   document.body.appendChild(icon);
    // });
    // console.log('📍 Added simple location icon at center');

    await page.evaluate(() => {
      const dot = document.createElement('div');
      dot.id = 'red-dot';
      dot.style.position = 'fixed';
      dot.style.top = '50%';
      dot.style.left = '50%';
      dot.style.width = '10px';
      dot.style.height = '10px';
      dot.style.backgroundColor = 'red';
      dot.style.borderRadius = '50%';
      dot.style.zIndex = '999999';
      dot.style.transform = 'translate(-50%, -50%)';
      document.body.appendChild(dot);
    });
    console.log('🔴 Added red dot in the center of screen');

    await delay(1000);

    //Zoom in
    await clickMultipleTimes(page, 1884, 1014, zoom);

    await delay(1000);

    await clickMultipleTimes(page, 1750, 1010, 1);

    await delay(1000);

    console.log('🎥 Recording screenshot videos 1 for 40 seconds...');

    const framesDir = await captureFrames(page, 20);

    console.log('🎞 Converting images to video...');

    const videoPath = await convertImagesToVideo(framesDir);

    await delay(1000);

    console.log('🛑 Closing page and browser...');

    await page.close();

    console.log('✅ Page closed.');

    await delay(1000);

    await browser.disconnect();

    await delay(1000);

    await browser.close();

    console.log('✅ Browser disconnect.');

    return videoPath;
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

  for (let i = 0; i < totalFrames; i++) {
    const filePath = path.join(
      framesDir,
      `frame-${String(i).padStart(4, '0')}.jpg`,
    );

    await page.screenshot({ path: filePath, type: 'jpeg' });

    await delay(1000 / frameRate); // Wait before capturing the next frame
  }

  return framesDir;
};

const convertImagesToVideo = async (framesDir: string): Promise<string> => {
  const videoFileName = `${uuidv4()}.mp4`; // 🔹 Generate a random video file name

  const videoPath = path.join(__dirname, videoFileName);

  return new Promise((resolve, reject) => {
    // const ffmpegCommand = `ffmpeg -framerate 5 -i ${framesDir}/frame-%04d.jpg -c:v libx264 -pix_fmt yuv420p ${videoPath}`;
    // 👇 Crop video: keep 80% of the height, cutting 10% from the top and 10% from the bottom

    const ffmpegCommand = `
    ffmpeg -framerate 5 -i ${framesDir}/frame-%04d.jpg \
    -vf "crop=in_w:in_h*0.8:0:in_h*0.1" \
    -c:v libx264 -pix_fmt yuv420p ${videoPath}
  `;

    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ FFmpeg error: ${stderr}`);
        reject(error);
      } else {
        console.log(`✅ Video created successfully: ${videoPath}`);
        resolve(videoPath);
      }
    });
  });
};

// const convertImagesToVideo = async (framesDir: string): Promise<string> => {
//   const videoFileName = `${uuidv4()}.mp4`;
//   const videoPath = path.join(__dirname, videoFileName);

//   return new Promise((resolve, reject) => {
//     const args = [
//       '-framerate',
//       '5',
//       '-i',
//       `${framesDir}/frame-%04d.jpg`,
//       '-vf',
//       'crop=in_w:in_h*0.7:0:in_h*0.2',
//       '-c:v',
//       'libx264',
//       '-pix_fmt',
//       'yuv420p',
//       videoPath,
//     ];

//     console.log('🚀 Running FFmpeg with args:', args);

//     const ffmpeg = spawn('ffmpeg', args);

//     ffmpeg.stdout.on('data', (data) => {
//       console.log(`📤 FFmpeg stdout: ${data}`);
//     });

//     ffmpeg.stderr.on('data', (data) => {
//       console.error(`⚠️ FFmpeg stderr: ${data}`);
//     });

//     ffmpeg.on('error', (err) => {
//       console.error(`❌ FFmpeg spawn error: ${err.message}`);
//       reject(err);
//     });

//     ffmpeg.on('close', (code) => {
//       if (code === 0) {
//         console.log(`✅ Video created successfully: ${videoPath}`);
//         resolve(videoPath);
//       } else {
//         reject(new Error(`FFmpeg exited with code ${code}`));
//       }
//     });
//   });
// };

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
