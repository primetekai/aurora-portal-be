import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Page } from 'puppeteer';

puppeteer.use(StealthPlugin());

export const captureGoogleEarthV1 = async (
  location: string,
): Promise<string> => {
  const browser = await puppeteer.launch({
    headless: false, // 🔥 Quan sát trình duyệt chạy
    defaultViewport: {
      width: 1920,
      height: 1080,
    }, // 🔥 Đặt kích thước màn hình cố định
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

    // 🔄 **Reload trang để làm mới UI**
    console.log('🔄 Reloading Google Earth Web...');
    await page.reload({ waitUntil: 'networkidle2' });

    // Đợi trang load lại hoàn toàn
    await delay(5000);

    // **Click vào tọa độ (50, 150) để ẩn UI**
    await hideUI(page, 880, 995);

    // Chờ UI ẩn hoàn toàn trước khi thực hiện thao tác tiếp theo
    await delay(3000);

    await hideUI(page, 1869, 735);

    // 🖱️ **Click chuột phải giữa màn hình để mở dropdown**
    // await rightClickCenter(page);

    // // 🖱️ **Di chuột qua phải 50px và xuống dưới 80px rồi click**
    // await moveAndClickDropdown(page, 50, 135);

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

// 🖱️ Click chính xác vào ô tìm kiếm
const clickSearchInput = async (page: Page) => {
  console.log('🖱️ Clicking on the search input...');

  const x = 185; // Vị trí x của ô tìm kiếm
  const y = 32; // Vị trí y của ô tìm kiếm

  await page.mouse.click(x, y);
  console.log(`✅ Clicked on search input at: (${x}, ${y})`);
};

// 🖱️ Click vào vị trí (50, 150) để ẩn UI sau khi reload
const hideUI = async (page: Page, x: number, y: number) => {
  console.log(`🖱️ Clicking at (${x}, ${y}) to hide UI...`);

  // Click 2 lần để chắc chắn UI biến mất
  for (let i = 0; i < 2; i++) {
    await page.mouse.click(x, y);
    await delay(500);
  }

  console.log(`✅ Clicked at (${x}, ${y}) to hide UI.`);
};

// 🖱️ **Click chuột phải giữa màn hình để mở dropdown**
const rightClickCenter = async (page: Page) => {
  console.log('🖱️ Right-clicking at the center of the screen...');

  const x = 960; // Giữa màn hình (1920/2)
  const y = 540; // Giữa màn hình (1080/2)

  await page.mouse.click(x, y, { button: 'right' });
  await delay(1000); // Chờ menu dropdown xuất hiện

  console.log(`✅ Right-clicked at (${x}, ${y})`);
};

// 🖱️ **Di chuột qua phải 50px và xuống dưới 80px rồi click**
const moveAndClickDropdown = async (
  page: Page,
  moveX: number,
  moveY: number,
) => {
  console.log(
    `🖱️ Moving mouse to select dropdown option (${moveX}px right, ${moveY}px down)...`,
  );

  const startX = 960; // Giữa màn hình (1920/2)
  const startY = 540; // Giữa màn hình (1080/2)

  const targetX = startX + moveX;
  const targetY = startY + moveY;

  await page.mouse.move(targetX, targetY);
  await delay(500); // Đợi chuột ổn định ở vị trí mới
  await page.mouse.click(targetX, targetY);

  console.log(`✅ Clicked on dropdown option at (${targetX}, ${targetY})`);
};

// Hàm delay thay thế waitForTimeout
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
