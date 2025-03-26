import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import path from 'path';
import type { Page } from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import { IVideoMetadata } from './capture-google-earth.type';
import * as ffmpeg from 'fluent-ffmpeg';
import os from 'os';
import { spawn } from 'child_process';

puppeteer.use(StealthPlugin());

const getLaunchOptions = () => {
  const platform = os.platform();
  const args = ['--no-sandbox', '--disable-setuid-sandbox'];
  let env = undefined;

  console.log('platform: ', {
    platform,
  });

  if (platform === 'darwin') {
    return { args, env };
  }

  if (platform === 'linux') {
    try {
      const distro = execSync('lsb_release -is', {
        encoding: 'utf-8',
      }).toLowerCase();

      console.log('distro: ', {
        distro,
      });

      if (distro.includes('ubuntu')) {
        args.push('--ozone-platform=wayland');
        env = {
          DISPLAY: ':0',
          WAYLAND_DISPLAY: 'wayland-0',
          XDG_SESSION_TYPE: 'wayland',
        };
      }
    } catch (e) {
      console.warn(
        '⚠️ Unable to detect the Linux system. Using default configuration.',
      );
    }
  }

  return { args, env };
};

export const captureGoogleEarth = async (
  location: string,
  zoom?: number,
): Promise<IVideoMetadata> => {
  let executablePath;

  if (os.platform() === 'darwin') {
    executablePath =
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  } else if (os.platform() === 'win32') {
    executablePath =
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  } else {
    executablePath = '/usr/bin/chromium-browser';
  }

  const { args, env } = getLaunchOptions();

  console.log('Config: ', {
    args,
    env,
  });

  const browser = await puppeteer.launch({
    executablePath,
    headless: false,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    args,
    env,
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  );

  try {
    console.log(`🔍 Opening Google Earth...`);

    await page.goto('https://earth.google.com/web/', {
      waitUntil: 'networkidle2',
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

    console.log('🎥 Starting high-quality video capture...');

    const framesDir = await captureFramesWithDynamicRate(page);
    const videoPath = await convertToVideo(framesDir);

    // Cleanup frames
    await fs
      .remove(framesDir)
      .catch((err) =>
        console.warn('⚠️ Warning: Could not remove frames directory:', err),
      );

    console.log('result', videoPath);
    await browser.close();
    return videoPath;
  } catch (error) {
    console.error('❌ Error during capture:', error);
    await browser.close();
    throw error;
  }
};

interface CapturePhase {
  duration: number;
  totalFrames: number;
}

const captureFramesWithDynamicRate = async (page: Page): Promise<string> => {
  const framesDir = path.join(__dirname, `frames-${uuidv4()}`);
  await fs.ensureDir(framesDir);

  // Define capture phases
  const phases: CapturePhase[] = [
    { duration: 5, totalFrames: 60 }, // First 5 seconds: 60 frames (12 fps)
    { duration: 5, totalFrames: 40 }, // Next 5 seconds: 40 frames (8 fps)
    { duration: 30, totalFrames: 50 }, // Last 30 seconds: 50 frames (~1.67 fps)
  ];

  let frameCount = 0;
  console.log('📸 Starting optimized frame capture...');

  for (const phase of phases) {
    const frameInterval = (phase.duration * 1000) / phase.totalFrames;
    const startTime = Date.now();
    const endTime = startTime + phase.duration * 1000;

    console.log(
      `🎥 Starting phase: ${phase.totalFrames} frames over ${phase.duration}s`,
    );

    for (let i = 0; i < phase.totalFrames; i++) {
      const frameNumber = String(frameCount).padStart(6, '0');
      const filePath = path.join(framesDir, `frame-${frameNumber}.png`);

      await page.screenshot({
        path: filePath,
        type: 'png',
        fullPage: false,
        optimizeForSpeed: false, // Prioritize quality over speed
      });

      frameCount++;

      if (frameCount % 10 === 0) {
        console.log(`📊 Captured ${frameCount} frames...`);
      }

      const nextCaptureTime = startTime + (i + 1) * frameInterval;
      const now = Date.now();
      const waitTime = Math.max(0, nextCaptureTime - now);

      if (waitTime > 0) {
        await delay(waitTime);
      }
    }
  }

  console.log(`✅ Capture completed: ${frameCount} total frames`);
  return framesDir;
};

// const convertToVideo = async (framesDir: string): Promise<string> => {
//   const videoPath = path.join(__dirname, `${uuidv4()}.mp4`);

//   const ffmpegCommand = `
//     ffmpeg -framerate 24 -i ${framesDir}/frame-%06d.png \
//     -c:v libx264 \
//     -preset slow \
//     -crf 18 \
//     -profile:v high \
//     -tune film \
//     -movflags +faststart \
//     -pix_fmt yuv420p \
//     -vf "scale=1920:1080:flags=lanczos,fps=24" \
//     -y ${videoPath}
//   `;

//   return new Promise((resolve, reject) => {
//     console.log('🎬 Converting frames to video...');

//     exec(ffmpegCommand, (error, stdout, stderr) => {
//       if (error) {
//         console.error('❌ FFmpeg error:', stderr);
//         reject(error);
//         return;
//       }

//       fs.stat(videoPath, (err, stats) => {
//         if (err) {
//           reject(new Error('Video file not created'));
//           return;
//         }

//         const fileSizeMB = stats.size / (1024 * 1024);
//         console.log(
//           `✅ Video created successfully! Size: ${fileSizeMB.toFixed(2)}MB`,
//         );
//         resolve(videoPath);
//       });
//     });
//   });
// };

const convertToVideo = async (framesDir: string): Promise<IVideoMetadata> => {
  const videoPath = path.join(__dirname, `${uuidv4()}.mp4`);

  const ffmpegArgs = [
    '-framerate',
    '24',
    '-i',
    `${framesDir}/frame-%06d.png`,
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '18',
    '-profile:v',
    'high',
    '-tune',
    'film',
    '-movflags',
    '+faststart',
    '-pix_fmt',
    'yuv420p',
    '-vf',
    'scale=1920:1080:flags=lanczos,fps=24',
    '-y',
    videoPath,
  ];

  console.log('🎬 Converting frames to video using spawn...');

  await new Promise<void>((resolve, reject) => {
    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

    ffmpegProcess.stdout.on('data', (data) => {
      console.log(`ffmpeg: ${data}`);
    });

    ffmpegProcess.stderr.on('data', (data) => {
      console.log(`ffmpeg err: ${data}`);
    });

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });

  const stats = await fs.promises.stat(videoPath);
  const fileSizeInBytes = stats.size;
  const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

  const files = await fs.promises.readdir(framesDir);
  const frameCount = files.filter((file) => file.endsWith('.png')).length;

  const duration = await new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration ?? 0);
    });
  });

  const metadata: IVideoMetadata = {
    videoPath,
    size: {
      bytes: fileSizeInBytes,
      megabytes: fileSizeInMB,
    },
    duration,
    frameCount,
  };

  console.log(
    `✅ Video created: ${fileSizeInMB.toFixed(2)}MB | Duration: ${duration.toFixed(2)}s`,
  );

  return metadata;
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
