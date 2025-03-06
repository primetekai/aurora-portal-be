import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Page } from 'puppeteer';
// import robot from 'robotjs'; // 🔥 Dùng để điều khiển chuột thật

puppeteer.use(StealthPlugin());

export const captureGoogleEarthV2 = async (
  location: string,
): Promise<string> => {
  const browser = await puppeteer.launch({
    headless: false, // 🔥 Để false để quan sát trình duyệt chạy
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

    // Mở Google Earth Web
    await page.goto('https://earth.google.com/web/', {
      waitUntil: 'networkidle2',
    });

    // Đợi Google Earth tải hoàn toàn
    await delay(5000);

    // Click vào ô tìm kiếm
    await clickSearchInput(page);

    // Gõ tọa độ và nhấn Enter
    await page.keyboard.type(location, { delay: 100 });
    await page.keyboard.press('Enter');

    // Đợi Google Earth zoom hoàn tất
    await delay(5000);

    // 🔄 Reload trang để làm mới UI
    console.log('🔄 Reloading Google Earth Web...');
    await page.reload({ waitUntil: 'networkidle2' });

    // Đợi trang load lại hoàn toàn
    await delay(5000);

    // 🖱️ **Dùng chuột thật click vào tọa độ (50, 150) để ẩn UI**
    // await moveAndClickRealMouse(880, 995);

    // Chờ UI ẩn hoàn toàn trước khi thực hiện thao tác tiếp theo
    await delay(3000);

    // // 🖱️ **Dùng chuột thật click chuột phải giữa màn hình**
    // await rightClickRealMouse(960, 540);

    // // 🖱️ **Di chuột thật qua phải 50px và xuống dưới 80px rồi click**
    // await moveAndClickRealMouse(1869, 735);

    // Chờ UI cập nhật trước khi chụp ảnh
    await delay(3000);

    // Chụp màn hình sau khi thực hiện xong tất cả thao tác
    console.log('📸 Capturing screenshot...');
    const screenshot = await page.screenshot({
      fullPage: true,
      encoding: 'base64',
    });

    return screenshot;
  } catch (error) {
    console.error('❌ Error capturing Google Earth screenshot:', error);
    await browser.close();
    throw error;
  }
};

// 🖱️ Click chính xác vào ô tìm kiếm bằng Puppeteer
const clickSearchInput = async (page: Page) => {
  console.log('🖱️ Clicking on the search input...');

  const x = 185; // Vị trí x của ô tìm kiếm
  const y = 32; // Vị trí y của ô tìm kiếm

  await page.mouse.click(x, y);
  console.log(`✅ Clicked on search input at: (${x}, ${y})`);
};

// 🖱️ **Dùng chuột thật di chuyển & click**
// const moveAndClickRealMouse = async (x: number, y: number) => {
//   console.log(`🖱️ Moving real mouse to (${x}, ${y})...`);
//   robot.moveMouseSmooth(x, y); // Dùng chuột thật di chuyển
//   await delay(500); // Chờ chuột di chuyển xong
//   robot.mouseClick(); // Click chuột thật
//   console.log(`✅ Real mouse clicked at (${x}, ${y})`);
// };

// // 🖱️ **Dùng chuột thật click chuột phải**
// const rightClickRealMouse = async (x: number, y: number) => {
//   console.log(`🖱️ Right-clicking real mouse at (${x}, ${y})...`);
//   robot.moveMouseSmooth(x, y);
//   await delay(500);
//   robot.mouseClick('right'); // Click chuột phải
//   console.log(`✅ Right-clicked at (${x}, ${y})`);
// };

// Hàm delay thay thế waitForTimeout
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
