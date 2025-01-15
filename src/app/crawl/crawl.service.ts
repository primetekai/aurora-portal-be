import { Injectable } from '@nestjs/common';
import { CrawlRepository } from './crawl.repository';
import { Crawl } from './crawl.entity';
import * as puppeteer from 'puppeteer';

@Injectable()
export class CrawlService {
  constructor(private sectionsRepository: CrawlRepository) {}

  async crawlUserInfoWithBrowser(
    phoneNumber: string,
    source: string,
  ): Promise<any> {
    const browser = await puppeteer.launch({ headless: false }); // Tắt headless để debug
    const page = await browser.newPage();

    try {
      // Truy cập trang web
      await page.goto('https://tracuusdt.com/sodienthoai', {
        waitUntil: 'domcontentloaded',
      });

      // Điền số điện thoại
      await page.type('input[name="phone_number"]', phoneNumber);

      // Nhấn nút tìm kiếm
      await page.click('button[type="submit"]');

      // Chờ phần tử chính xuất hiện
      await page.waitForSelector('.phone-detail', { timeout: 15000 });

      // Cuộn trang để tải bình luận (nếu cần)
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
        });

        // Thay page.waitForTimeout(1000)
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Chờ 1 giây
      }

      // Lấy dữ liệu từ trang
      const result = await page.evaluate(() => {
        const detailElement = document.querySelector('.phone-detail');
        const commentContainer = document.querySelector('.phone-comment-items');

        if (!detailElement) {
          throw new Error('Không tìm thấy thông tin chi tiết.');
        }

        // Lấy thông tin chính
        const viewsInfo = detailElement
          .querySelector('p:nth-child(1)')
          ?.textContent.trim();
        const summaryInfo = detailElement
          .querySelector('p:nth-child(2)')
          ?.textContent.trim();
        const networkInfo = detailElement
          .querySelector('p:nth-child(3)')
          ?.textContent.trim();

        // Tách thông tin chi tiết
        const viewsMatch = viewsInfo?.match(
          /Lượt xem:\s*(\d+)\s*\/\s*Lượt tìm kiếm:\s*(\d+)/,
        );
        const views = viewsMatch
          ? { views: Number(viewsMatch[1]), searches: Number(viewsMatch[2]) }
          : null;

        const updatedAtMatch = viewsInfo?.match(
          /Cập nhật:\s*(\d{2}\/\d{2}\/\d{4})/,
        );
        const updatedAt = updatedAtMatch ? updatedAtMatch[1] : null;

        const summaryMatch = summaryInfo?.match(
          /Tóm lược:\s*([^<]+)\s+\(([^)]+)\)/,
        );
        const summary = summaryMatch ? summaryMatch[1].trim() : null;

        const sentimentMatch = summaryInfo?.match(
          /(\d+)\s*tích cực,\s*(\d+)\s*tiêu cực,\s*(\d+)\s*không chắc chắn/,
        );
        const sentiment = sentimentMatch
          ? {
              positive: Number(sentimentMatch[1]),
              negative: Number(sentimentMatch[2]),
              uncertain: Number(sentimentMatch[3]),
            }
          : null;

        const totalReviewsMatch = summaryInfo?.match(
          /tổ số\s*<u>(\d+)<\/u>\s*lượt đánh giá/,
        );
        const totalReviews = totalReviewsMatch
          ? Number(totalReviewsMatch[1])
          : 0;

        const network = networkInfo?.replace('Mạng:', '').trim();

        // Lấy danh sách bình luận
        const comments = [];
        if (commentContainer) {
          const commentItems =
            commentContainer.querySelectorAll('.comment-item');
          commentItems.forEach((item) => {
            const time = item
              .querySelector('.comment-time')
              ?.textContent.trim();
            const content = item
              .querySelector('.comment-content')
              ?.textContent.trim();
            if (time && content) {
              comments.push({ time, content });
            }
          });
        }

        return {
          views,
          updatedAt,
          summary,
          sentiment,
          totalReviews,
          network,
          comments,
        };
      });

      await browser.close();

      return {
        success: true,
        phoneNumber,
        data: result,
      };
    } catch (error) {
      await browser.close();
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async crawlUserInfo(phoneNumber: string, source: string): Promise<any> {
    const browser = await puppeteer.launch({
      headless: true, // Chạy chế độ ẩn
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, // Đường dẫn Google Chrome
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });

    const page = await browser.newPage();

    try {
      // Truy cập trang web
      await page.goto('https://tracuusdt.com/sodienthoai', {
        waitUntil: 'domcontentloaded',
      });

      // Điền số điện thoại
      await page.type('input[name="phone_number"]', phoneNumber);

      // Nhấn nút tìm kiếm
      await page.click('button[type="submit"]');

      // Chờ phần tử chính xuất hiện
      await page.waitForSelector('.phone-detail', { timeout: 30000 });

      // Cuộn trang để tải toàn bộ bình luận
      let previousHeight;
      do {
        previousHeight = await page.evaluate('document.body.scrollHeight');
        await page.evaluate('window.scrollBy(0, document.body.scrollHeight)');
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Chờ 1.5 giây
      } while (
        (await page.evaluate('document.body.scrollHeight')) > previousHeight
      );

      // Lấy dữ liệu từ trang
      const result = await page.evaluate(() => {
        const detailElement = document.querySelector('.phone-detail');
        const commentContainer = document.querySelector('.phone-comment-items');

        if (!detailElement) {
          throw new Error('Không tìm thấy thông tin chi tiết.');
        }

        // Lấy thông tin chính
        const viewsInfo = detailElement
          .querySelector('p:nth-child(1)')
          ?.textContent.trim();
        const summaryInfo = detailElement
          .querySelector('p:nth-child(2)')
          ?.textContent.trim();
        const networkInfo = detailElement
          .querySelector('p:nth-child(3)')
          ?.textContent.trim();

        // Tách thông tin chi tiết
        const viewsMatch = viewsInfo?.match(
          /Lượt xem:\s*(\d+)\s*\/\s*Lượt tìm kiếm:\s*(\d+)/,
        );
        const views = viewsMatch
          ? { views: Number(viewsMatch[1]), searches: Number(viewsMatch[2]) }
          : null;

        const updatedAtMatch = viewsInfo?.match(
          /Cập nhật:\s*(\d{2}\/\d{2}\/\d{4})/,
        );
        const updatedAt = updatedAtMatch ? updatedAtMatch[1] : null;

        const summaryMatch = summaryInfo?.match(
          /Tóm lược:\s*([^<]+)\s+\(([^)]+)\)/,
        );
        const summary = summaryMatch ? summaryMatch[1].trim() : null;

        const sentimentMatch = summaryInfo?.match(
          /(\d+)\s*tích cực,\s*(\d+)\s*tiêu cực,\s*(\d+)\s*không chắc chắn/,
        );
        const sentiment = sentimentMatch
          ? {
              positive: Number(sentimentMatch[1]),
              negative: Number(sentimentMatch[2]),
              uncertain: Number(sentimentMatch[3]),
            }
          : null;

        const totalReviewsMatch = summaryInfo?.match(
          /tổ số\s*<u>(\d+)<\/u>\s*lượt đánh giá/,
        );
        const totalReviews = totalReviewsMatch
          ? Number(totalReviewsMatch[1])
          : 0;

        const network = networkInfo?.replace('Mạng:', '').trim();

        // Lấy danh sách bình luận
        const comments = [];
        if (commentContainer) {
          const commentItems =
            commentContainer.querySelectorAll('.comment-item');
          commentItems.forEach((item) => {
            const time = item
              .querySelector('.comment-time')
              ?.textContent.trim();
            const content = item
              .querySelector('.comment-content')
              ?.textContent.trim();
            if (time && content) {
              comments.push({ time, content });
            }
          });
        }

        return {
          views,
          updatedAt,
          summary,
          sentiment,
          totalReviews,
          network,
          comments,
        };
      });

      await browser.close();

      return {
        success: true,
        phoneNumber,
        data: result,
      };
    } catch (error) {
      await browser.close();
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async crawlPhoneValuation(phoneNumber: string, source: string): Promise<any> {
    const browser = await puppeteer.launch({
      headless: true, // Chạy chế độ ẩn
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, // Đường dẫn Google Chrome
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });

    const page = await browser.newPage();

    try {
      await page.goto('https://sim.vn/dinh-gia-sim', {
        waitUntil: 'domcontentloaded',
      });

      await page.type('input[id="sim"]', phoneNumber);

      await page.click('button[class="btn-submit"]');

      await page.waitForSelector('.result-form-dinh-gia-sim', {
        timeout: 10000,
      });

      const result = await page.evaluate(() => {
        const priceElement = document.querySelector(
          '.result-form-dinh-gia-sim span.text-orange-600:last-of-type',
        );

        if (!priceElement) {
          throw new Error('Không tìm thấy thông tin chi tiết.');
        }

        const price = priceElement.textContent.trim();

        return {
          price,
        };
      });

      await browser.close();

      return {
        success: true,
        phoneNumber,
        data: result,
      };
    } catch (error) {
      await browser.close();
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async crawlPhoneValuationV2(
    phoneNumber: string,
    source: string,
  ): Promise<any> {
    const browser = await puppeteer.launch({
      headless: true, // Chạy chế độ ẩn
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, // Đường dẫn Google Chrome
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });

    const page = await browser.newPage();

    try {
      await page.goto(
        `https://dinhgiasimonline.com.vn/phone/${phoneNumber}/#simdinhgia`,
        {
          waitUntil: 'domcontentloaded',
        },
      );

      const result = await page.evaluate(() => {
        const extractText = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : null;
        };

        const extractAllText = (selector) => {
          const elements = document.querySelectorAll(selector);
          return Array.from(elements).map((el) => el.textContent.trim());
        };

        // Panel 1: Pricing Panel (Định giá Sim)
        const pricingPanel = {
          priceTitle: extractText('#one-panel .price_title'),
          price: extractText('#one-panel .price_sdt .counter'),
          priceText: extractText('#one-panel .price_text'),
          contactNumber: extractText('#one-panel .frame_sdt a'),
          reasonForPrice: extractText('#one-panel .why_sdt'),
          meanings: extractAllText('#one-panel .frame_sdt_ynghia .sologun b'),
          analysis: extractAllText('#one-panel .frame_sdt_ynghia p').filter(
            (text) => text.includes('»'),
          ),
        };

        // Panel 2: Meaning Panel (Ý nghĩa Sim)
        const meaningPanel = {
          summary: extractText('#two-panel .content_dichnghia .title_home'),
          phoneInfo: extractText(
            '#two-panel .content_dichnghia p:nth-of-type(2)',
          ),
          networkCarrier: extractText(
            '#two-panel .content_dichnghia p:nth-of-type(3)',
          ),
          alternateFormats: extractText(
            '#two-panel .content_dichnghia p:nth-of-type(4)',
          ),
          numberAnalysis: extractAllText(
            '#two-panel .content_dichnghia h2 + p',
          ),
          meaningsByPair: extractAllText(
            '#two-panel .content_dichnghia h2:nth-of-type(3) + p + p + p',
          ),
          compatibilityAnalysis: {
            compatible: extractText('#two-panel .tho'),
            incompatible: extractAllText(
              '#two-panel .kim, #two-panel .moc, #two-panel .thuy, #two-panel .hoa',
            ),
          },
        };

        // Panel 3: Cheap Sim Panel (Tìm Sim giá rẻ)
        const cheapSimPanel = {
          message: extractText('#three-panel .no-data'),
          imageAlt: extractText('#three-panel img[alt]'),
        };

        return {
          pricingPanel,
          meaningPanel,
          cheapSimPanel,
        };
      });

      console.log(result);

      await browser.close();

      return {
        success: true,
        phoneNumber,
        data: result,
      };
    } catch (error) {
      await browser.close();
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async crawlFengShuiSim(
    phoneNumber: string,
    birthHour: string,
    birthDay: string,
    birthMonth: string,
    birthYear: string,
    gender: string,
  ): Promise<any> {
    const browser = await puppeteer.launch({
      headless: true, // Chạy chế độ ẩn
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, // Đường dẫn Google Chrome
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });

    const page = await browser.newPage();

    try {
      // Truy cập trang
      await page.goto('https://simphongthuy.vn/xem-phong-thuy-sim', {
        waitUntil: 'domcontentloaded',
      });

      // Điền số điện thoại
      await page.type('input[name="so_sim"]', phoneNumber);

      // Chọn giới tính
      const genderSelector =
        gender === 'nam' ? '#gioi_tinh_nam' : '#gioi_tinh_nu';
      await page.click(genderSelector);

      // Chọn giờ sinh
      await page.select('select[name="gio_sinh"]', birthHour);

      // Chọn ngày sinh
      await page.select('select[name="ngay_sinh"]', birthDay);

      // Chọn tháng sinh
      await page.select('select[name="thang_sinh"]', birthMonth);

      // Chọn năm sinh
      await page.select('select[name="nam_sinh"]', birthYear);

      // Ấn nút gửi
      await page.click('button#submitFormXpt');

      // Chờ kết quả hiển thị
      await page.waitForSelector('.luan_sim', { timeout: 5000 });

      // Thu thập dữ liệu
      const result = await page.evaluate(() => {
        const data: any = {};

        // Tìm thông tin mệnh chủ
        data.menhChu =
          document.querySelector('.title-block')?.textContent.trim() || '';

        // Tứ Trụ
        const tuTruElement = Array.from(document.querySelectorAll('p')).find(
          (p) => p.textContent.includes('Tứ Trụ'),
        );
        data.tuTru = tuTruElement ? tuTruElement.textContent.trim() : '';

        // Trạch mệnh
        const trachMenhElement = Array.from(
          document.querySelectorAll('p'),
        ).find((p) => p.textContent.includes('Trạch mệnh'));
        data.trachMenh = trachMenhElement
          ? trachMenhElement.textContent.trim()
          : '';

        // Ngũ hành bản mệnh
        const nguHanhElement = Array.from(document.querySelectorAll('p')).find(
          (p) => p.textContent.includes('Ngũ hành bản mệnh'),
        );
        data.nguHanhBanMenh = nguHanhElement
          ? nguHanhElement.textContent.trim()
          : '';

        // Điểm phong thủy
        data.phongThuyScore =
          document.querySelector('.highlight')?.textContent.trim() || '';

        // Kết luận tổng điểm
        const ketLuanElement = document.querySelector('.ketLuanTongDiem p');
        data.ketLuan = ketLuanElement ? ketLuanElement.textContent.trim() : '';

        // Số sim
        data.simNumber =
          document.querySelector('.soSim')?.textContent.trim() || '';

        return data;
      });

      await browser.close();

      return {
        success: true,
        phoneNumber,
        data: result,
      };
    } catch (error) {
      await browser.close();
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async crawlFengShuiSim1(
    phoneNumber: string,
    birthHour: string,
    birthDay: string,
    birthMonth: string,
    birthYear: string,
    gender: string,
  ): Promise<any> {
    const browser = await puppeteer.launch({
      headless: true, // Chạy chế độ ẩn
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, // Đường dẫn Google Chrome
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });

    const page = await browser.newPage();

    try {
      // Truy cập trang
      await page.goto('https://simphongthuy.vn/xem-phong-thuy-sim', {
        waitUntil: 'domcontentloaded',
      });

      // Điền số điện thoại
      await page.type('input[name="so_sim"]', phoneNumber);

      // Chọn giới tính
      const genderSelector =
        gender === 'nam' ? '#gioi_tinh_nam' : '#gioi_tinh_nu';
      await page.click(genderSelector);

      // Chọn giờ sinh
      await page.select('select[name="gio_sinh"]', birthHour);

      // Chọn ngày sinh
      await page.select('select[name="ngay_sinh"]', birthDay);

      // Chọn tháng sinh
      await page.select('select[name="thang_sinh"]', birthMonth);

      // Chọn năm sinh
      await page.select('select[name="nam_sinh"]', birthYear);

      // Ấn nút gửi
      await page.click('button#submitFormXpt');

      // Chờ kết quả hiển thị
      await page.waitForSelector('.luan_sim', { timeout: 10000 });

      // Thu thập dữ liệu
      const result = await page.evaluate(() => {
        const data: any = {};

        const section = document.querySelector('section.luan_sim');
        if (!section) {
          throw new Error('Không tìm thấy phần kết quả.');
        }

        // Lấy thông tin mệnh chủ
        data.menhChu =
          section.querySelector('.title-block')?.textContent.trim() || '';

        // Lấy thông tin Tứ Trụ
        const tuTruMatch = section.innerHTML.match(
          /<b>Tứ Trụ:<\/b> Giờ <b.*?>(.*?)<\/b>, ngày <b.*?>(.*?)<\/b> tháng <b.*?>(.*?)<\/b> năm <b.*?>(.*?)<\/b>/,
        );
        if (tuTruMatch) {
          data.tuTru = {
            gio: tuTruMatch[1],
            ngay: tuTruMatch[2],
            thang: tuTruMatch[3],
            nam: tuTruMatch[4],
          };
        }

        // Số lượng chỉ
        const soLuongChiMatch = section.innerHTML.match(
          /<b>Số lượng chỉ:<\/b> (.*?)\./,
        );
        data.soLuongChi = soLuongChiMatch ? soLuongChiMatch[1] : '';

        // Trạch mệnh
        const trachMenhMatch = section.innerHTML.match(
          /<b>Trạch mệnh:<\/b> (.*?)<\/p>/,
        );
        data.trachMenh = trachMenhMatch ? trachMenhMatch[1] : '';

        // Ngũ hành bản mệnh
        const nguHanhBanMenhMatch = section.innerHTML.match(
          /<b>Ngũ hành bản mệnh:<\/b>(.*?)<br>/,
        );
        data.nguHanhBanMenh = nguHanhBanMenhMatch
          ? nguHanhBanMenhMatch[1].trim()
          : '';

        // Cân xương đoán cốt
        const canXuongMatch = section.innerHTML.match(
          /<b>Cân xương đoán cốt:<\/b>(.*?)<\/p>/,
        );
        data.canXuongDoanCot = canXuongMatch ? canXuongMatch[1].trim() : '';

        // Ngũ hành sinh mệnh
        const nguHanhSinhMenhMatch = section.innerHTML.match(
          /<b>Ngũ hành sinh mệnh:<\/b>\s*<b.*?>(.*?)<\/b>/,
        );
        data.nguHanhSinhMenh = nguHanhSinhMenhMatch
          ? nguHanhSinhMenhMatch[1]
          : '';

        // Ngũ hành khắc mệnh
        const nguHanhKhacMenhMatch = section.innerHTML.match(
          /<b>Ngũ hành khắc mệnh:<\/b>\s*<b.*?>(.*?)<\/b>/,
        );
        data.nguHanhKhacMenh = nguHanhKhacMenhMatch
          ? nguHanhKhacMenhMatch[1]
          : '';

        // Số sim
        data.simNumber =
          section.querySelector('.soSim')?.textContent.trim() || '';

        // Điểm phong thủy
        data.phongThuyScore =
          section.querySelector('.highlight')?.textContent.trim() || '';

        // Kết luận
        data.ketLuan =
          section.querySelector('.ketLuanTongDiem p')?.textContent.trim() || '';

        // Quẻ chủ
        const queChuMatch = section.innerHTML.match(
          /<b>Sim có quẻ chủ là:<\/b>\s*(.*?)\(/,
        );
        data.queChu = queChuMatch ? queChuMatch[1].trim() : '';

        // Quẻ hỗ
        const queHoMatch = section.innerHTML.match(
          /<b>Sim có quẻ hỗ là:<\/b>\s*(.*?)\(/,
        );
        data.queHo = queHoMatch ? queHoMatch[1].trim() : '';

        return data;
      });

      await browser.close();

      return {
        success: true,
        phoneNumber,
        data: result,
      };
    } catch (error) {
      await browser.close();
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async crawlDataWithSource(data: Record<string, any>): Promise<Crawl> {
    return this.sectionsRepository.createCrawl(data);
  }
}
