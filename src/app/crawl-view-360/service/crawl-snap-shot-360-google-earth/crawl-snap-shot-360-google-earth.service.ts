import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs-extra';
import { exec } from 'child_process';
import path from 'path';
import type { Page } from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';

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
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
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

    await delay(1000);

    console.log('🎥 Starting high-quality video capture...');

    const framesDir = await captureFramesWithDynamicRate(page);
    const videoPath = await convertToVideo(framesDir);

    // Cleanup frames
    await fs
      .remove(framesDir)
      .catch((err) =>
        console.warn('⚠️ Warning: Could not remove frames directory:', err),
      );

    await browser.close();
    return videoPath;
  } catch (error) {
    console.error('❌ Error during capture:', error);
    await browser.close();
    throw error;
  }
};

const captureFramesMac = async (
  page: Page,
  duration: number,
): Promise<string> => {
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

// Rap
const captureFrames1 = async (
  page: Page,
  duration: number,
): Promise<string> => {
  const framesDir = path.join(__dirname, 'frames');
  await fs.ensureDir(framesDir);

  const endTimeFirstPart = 5000; // 5 giây đầu
  const endTimeSecondPart = 10000; // 10 giây đầu
  const endTimeThirdPart = duration * 1000; // 40 giây đầy đủ

  let currentTime = 0;
  let frameRate;
  let totalFrames = 0;

  while (currentTime < endTimeThirdPart) {
    if (currentTime < endTimeFirstPart) {
      frameRate = 12; // 12 frames/giây
    } else if (currentTime < endTimeSecondPart) {
      frameRate = 8; // 8 frames/giây
    } else {
      frameRate = 1.67; // 1.67 frames/giây
    }

    const filePath = path.join(
      framesDir,
      `frame-${String(Math.floor(currentTime / 1000)).padStart(4, '0')}.jpg`,
    );

    await page.screenshot({ path: filePath, type: 'jpeg' });

    const delayTime = 1000 / frameRate;
    await delay(delayTime);
    currentTime += delayTime;
    totalFrames++;
  }

  console.log(`Total frames captured: ${totalFrames}`);
  return framesDir;
};

const captureFrames = async (page: Page, duration: number): Promise<string> => {
  const framesDir = path.join(__dirname, 'frames');
  await fs.ensureDir(framesDir);

  const endTimeFirstPart = 5000; // 5 giây đầu
  const endTimeSecondPart = 10000; // 10 giây đầu
  const endTimeThirdPart = duration * 1000; // 40 giây đầy đủ

  let currentTime = 0;
  let frameRate;
  let totalFrames = 0;

  while (currentTime < endTimeThirdPart) {
    if (currentTime < endTimeFirstPart) {
      frameRate = 66.6; // 66.6 frames/giây
    } else if (currentTime < endTimeSecondPart) {
      frameRate = 66.6; // 66.6 frames/giây
    } else {
      frameRate = 11.1; // 11.1 frames/giây
    }

    const filePath = path.join(
      framesDir,
      `frame-${String(Math.floor(currentTime / 1000)).padStart(4, '0')}.jpg`,
    );

    await page.screenshot({ path: filePath, type: 'jpeg' });

    const delayTime = 1000 / frameRate;
    await delay(delayTime);
    currentTime += delayTime;
    totalFrames++;
  }

  console.log(`Total frames captured: ${totalFrames}`);
  return framesDir;
};

interface CaptureConfig {
  startFrameRate: number;
  midFrameRate: number;
  endFrameRate: number;
  quality: number;
  format: 'jpeg' | 'png';
}

const captureFramesHQ = async (
  page: Page,
  duration: number,
  config: CaptureConfig = {
    startFrameRate: 60, // Smooth start
    midFrameRate: 45, // Good middle motion
    endFrameRate: 30, // Stable end
    quality: 100, // Maximum quality
    format: 'png', // Better quality than JPEG
  },
): Promise<string> => {
  const framesDir = path.join(__dirname, `frames-${uuidv4()}`);
  await fs.ensureDir(framesDir);

  const phases = [
    { duration: 5000, frameRate: config.startFrameRate }, // First 5 seconds
    { duration: 5000, frameRate: config.midFrameRate }, // Next 5 seconds
    { duration: (duration - 10) * 1000, frameRate: config.endFrameRate }, // Remaining time
  ];

  let currentTime = 0;
  let frameCount = 0;

  console.log('📸 Starting high-quality frame capture...');

  for (const phase of phases) {
    const endTime = currentTime + phase.duration;
    const frameInterval = 1000 / phase.frameRate;

    while (currentTime < endTime) {
      const frameNumber = String(frameCount).padStart(6, '0');
      const filePath = path.join(
        framesDir,
        `frame-${frameNumber}.${config.format}`,
      );

      await page.screenshot({
        path: filePath,
        type: config.format,
        quality: config.format === 'jpeg' ? config.quality : undefined,
        fullPage: false,
        optimizeForSpeed: true,
      });

      frameCount++;
      currentTime += frameInterval;
      await delay(frameInterval);

      if (frameCount % 100 === 0) {
        console.log(`📊 Captured ${frameCount} frames...`);
      }
    }
  }

  console.log(`✅ Total frames captured: ${frameCount}`);
  return framesDir;
};

interface CapturePhase {
  duration: number; // in seconds
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

const convertImagesToVideo = async (
  framesDir: string,
  totalFrames: number,
  desiredDuration: number,
): Promise<string> => {
  const videoFileName = `${uuidv4()}.mp4`;
  const videoPath = path.join(__dirname, videoFileName);

  // Tính tỷ lệ khung hình dựa trên tổng số frames và thời gian mong muốn của video
  const frameRate = totalFrames / desiredDuration;

  const ffmpegCommand = `
    ffmpeg -framerate ${frameRate} -i ${framesDir}/frame-%04d.jpg \
    -c:v libx264 -pix_fmt yuv420p -t ${desiredDuration} ${videoPath}
  `;

  return new Promise((resolve, reject) => {
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

// 300 frame
const convertImagesToVideo300s = async (framesDir: string): Promise<string> => {
  const videoFileName = `${uuidv4()}.mp4`;
  const videoPath = path.join(__dirname, videoFileName);

  const averageFrameRate = 150 / 40; // Tính tỷ lệ khung hình trung bình từ tổng số frames và thời gian

  const ffmpegCommand = `
    ffmpeg -framerate ${averageFrameRate} -i ${framesDir}/frame-%04d.jpg \
    -vf "crop=in_w:in_h*0.8:0:in_h*0.1" \
    -c:v libx264 -pix_fmt yuv420p ${videoPath}
  `;

  return new Promise((resolve, reject) => {
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

const convertImagesToVideoMac = async (framesDir: string): Promise<string> => {
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

const convertToHighQualityVideo = async (
  framesDir: string,
  outputFileName: string = `${uuidv4()}.mp4`,
): Promise<string> => {
  const videoPath = path.join(__dirname, outputFileName);

  // Advanced FFmpeg settings for high quality
  const ffmpegCommand = `
    ffmpeg -framerate 60 -i ${framesDir}/frame-%06d.png \
    -c:v libx264 \
    -preset slow \
    -crf 17 \
    -profile:v high \
    -tune film \
    -movflags +faststart \
    -pix_fmt yuv420p \
    -vf "scale=1920:1080:flags=lanczos,crop=in_w:in_h*0.8:0:in_h*0.1" \
    -metadata title="Google Earth 360 View" \
    -y ${videoPath}
  `;

  return new Promise((resolve, reject) => {
    console.log('🎬 Starting video encoding...');

    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ FFmpeg error:', stderr);
        reject(error);
        return;
      }

      // Verify the output video
      fs.stat(videoPath, (err, stats) => {
        if (err) {
          reject(new Error('Video file not created'));
          return;
        }

        const fileSizeMB = stats.size / (1024 * 1024);
        console.log(
          `✅ Video created successfully! Size: ${fileSizeMB.toFixed(2)}MB`,
        );
        resolve(videoPath);
      });
    });
  });
};

const convertToVideo = async (framesDir: string): Promise<string> => {
  const videoPath = path.join(__dirname, `${uuidv4()}.mp4`);

  const ffmpegCommand = `
    ffmpeg -framerate 24 -i ${framesDir}/frame-%06d.png \
    -c:v libx264 \
    -preset slow \
    -crf 18 \
    -profile:v high \
    -tune film \
    -movflags +faststart \
    -pix_fmt yuv420p \
    -vf "scale=1920:1080:flags=lanczos,fps=24" \
    -y ${videoPath}
  `;

  return new Promise((resolve, reject) => {
    console.log('🎬 Converting frames to video...');

    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ FFmpeg error:', stderr);
        reject(error);
        return;
      }

      fs.stat(videoPath, (err, stats) => {
        if (err) {
          reject(new Error('Video file not created'));
          return;
        }

        const fileSizeMB = stats.size / (1024 * 1024);
        console.log(
          `✅ Video created successfully! Size: ${fileSizeMB.toFixed(2)}MB`,
        );
        resolve(videoPath);
      });
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
