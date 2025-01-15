import {
  Controller,
  Get,
  Res,
  HttpStatus,
  Logger,
  Query,
  HttpException,
} from '@nestjs/common';
import { CrawlService } from './crawl.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CRAWL_SERVICE } from 'src/config';
import { Response } from 'express';
import puppeteer from 'puppeteer-extra';
import { default as StealthPlugin } from 'puppeteer-extra-plugin-stealth';
import type { Page, WaitForOptions } from 'puppeteer';

puppeteer.use(StealthPlugin());

@Controller(CRAWL_SERVICE)
@ApiTags('crawl')
export class CrawlController {
  private logger = new Logger('CrawlController');

  constructor(private crawlService: CrawlService) {}

  /**
   * Phone information
   */
  @ApiQuery({ name: 'phoneNumber', description: 'Phone information' })
  @ApiQuery({
    name: 'source',
    description: 'Source to crawl from',
    required: false,
  })
  @ApiOperation({ summary: 'Craw information by phone' })
  @ApiResponse({ status: 200, description: 'Return information.' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Get('/phone')
  async getPhoneInformationWithHiddenBrowser(
    @Query('phoneNumber') phoneNumber: string,
    @Query('source') source: string = 'sourceX',

    @Res() res,
  ) {
    try {
      const crawlResult = await this.crawlService.crawlUserInfo(
        phoneNumber,
        source,
      );

      return res.status(HttpStatus.OK).json(crawlResult);
    } catch (e) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }

  /**
   * Phone information with browser
   */
  @ApiQuery({
    name: 'phoneNumber',
    description: 'Phone information with browser',
  })
  @ApiQuery({
    name: 'source',
    description: 'Source to crawl from',
    required: false,
  })
  @ApiOperation({ summary: 'Craw information by phone' })
  @ApiResponse({ status: 200, description: 'Return information.' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Get('/phone-browser')
  async getPhoneInformationWithBrowser(
    @Query('phoneNumber') phoneNumber: string,
    @Query('source') source: string = 'sourceX',

    @Res() res,
  ) {
    try {
      const crawlResult = await this.crawlService.crawlUserInfoWithBrowser(
        phoneNumber,
        source,
      );

      return res.status(HttpStatus.OK).json(crawlResult);
    } catch (e) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }

  /**
   * Phone valuation https://sim.vn/dinh-gia-sim
   */
  @ApiQuery({ name: 'phoneNumber', description: 'Phone valuation' })
  @ApiQuery({
    name: 'source',
    description: 'Source to crawl from',
    required: false,
  })
  @ApiOperation({ summary: 'Craw information by phone' })
  @ApiResponse({ status: 200, description: 'Return information.' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Get('/phone/valuation')
  async getPhoneValuationInformationWithHiddenBrowser(
    @Query('phoneNumber') phoneNumber: string,
    @Query('source') source: string = 'sourceX',

    @Res() res,
  ) {
    try {
      const crawlResult = await this.crawlService.crawlPhoneValuation(
        phoneNumber,
        source,
      );

      return res.status(HttpStatus.OK).json(crawlResult);
    } catch (e) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }

  /**
   * Phone valuation dinhgiasimonline.com.vn/
   */
  @ApiQuery({ name: 'phoneNumber', description: 'Phone valuation' })
  @ApiQuery({
    name: 'source',
    description: 'Source to crawl from',
    required: false,
  })
  @ApiOperation({ summary: 'Craw information by phone' })
  @ApiResponse({ status: 200, description: 'Return information.' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Get('/phone/valuation-info')
  async getPhoneValuationVer2InformationWithHiddenBrowser(
    @Query('phoneNumber') phoneNumber: string,
    @Query('source') source: string = 'sourceX',

    @Res() res,
  ) {
    try {
      const crawlResult = await this.crawlService.crawlPhoneValuationV2(
        phoneNumber,
        source,
      );

      return res.status(HttpStatus.OK).json(crawlResult);
    } catch (e) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }

  /**
   * Feng shui sim
   */
  @ApiQuery({ name: 'phoneNumber', description: 'Feng shui sim' })
  @ApiQuery({
    name: 'Birth Hour',
    description: 'birthHour to crawl from',
    required: false,
  })
  @ApiOperation({ summary: 'Craw feng shui sim' })
  @ApiResponse({ status: 200, description: 'Return feng shui sim .' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Get('/phone/feng-shui-sim')
  async getPhoneFengShuiInformationWithHiddenBrowser(
    @Query('phoneNumber') phoneNumber: string,
    @Query('birthHour') birthHour: string,
    @Query('birthDay') birthDay: string,
    @Query('birthMonth') birthMonth: string,
    @Query('birthYear') birthYear: string,
    @Query('gender') gender: string,
    @Res() res,
  ) {
    try {
      const crawlResult = await this.crawlService.crawlFengShuiSim(
        phoneNumber,
        birthHour,
        birthDay,
        birthMonth,
        birthYear,
        gender,
      );

      return res.status(HttpStatus.OK).json(crawlResult);
    } catch (e) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }

  @Get('generate-image')
  @ApiQuery({
    name: 'url',
    required: true,
    description: 'URL của trang web cần chụp hình',
  })
  @ApiQuery({
    name: 'source',
    required: true,
    description: 'Nguồn của trang web (e.g., facebook, google)',
  })
  @ApiResponse({ status: 200, description: 'Trả về file ảnh của trang web' })
  @ApiResponse({
    status: 400,
    description: 'URL hoặc nguồn không hợp lệ',
  })
  async generateImage(
    @Query('url') url: string,
    @Query('source') source: string,
    @Res() res: Response,
  ) {
    try {
      const browser = await puppeteer.launch({
        headless: true,
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

      if (source === 'facebook') {
        await this.safeGoto(page, url, {
          waitUntil: 'networkidle0',
          timeout: 10000,
        });

        const closeButtonSelector = 'div[aria-label="Close"][role="button"]';

        await page.waitForSelector(closeButtonSelector, { visible: true });

        await page.click(closeButtonSelector);

        await page.evaluate(() => {
          const popup = document.querySelector('div[data-nosnippet]');
          if (popup) {
            popup.remove();
          }
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      } else if (source === 'tiktok') {
        await this.safeGoto(page, url, {
          waitUntil: 'networkidle0',
          timeout: 10000,
        });

        const closeButtonSelector = 'button[aria-label="Close"][role="button"]';

        await page.waitForSelector(closeButtonSelector, { visible: true });

        await page.click(closeButtonSelector);

        await new Promise((resolve) => setTimeout(resolve, 100));
      } else {
        await this.safeGoto(page, url, {
          waitUntil: 'networkidle0',
          timeout: 10000,
        });
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const base64Image: string = await page.screenshot({
        fullPage: true,
        encoding: 'base64',
      });

      await browser.close();

      res.set({ 'Content-Type': 'application/json' });
      return res.json({ base64: `data:image/png;base64,${base64Image}` });
    } catch (error) {
      console.error('Error generating screenshot:', error);
      throw new HttpException(
        'Failed to generate screenshot',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async safeGoto(
    page: Page,
    url: string,
    options: WaitForOptions,
  ): Promise<void> {
    for (let i = 0; i < 3; i++) {
      try {
        console.log(`Attempt ${i + 1}: Navigating to ${url}`);
        await page.goto(url, options);
        return;
      } catch (error) {
        console.warn(`Attempt ${i + 1} failed: ${error.message}`);
        if (i === 2) {
          console.error('Final attempt failed. Throwing error.');
        }
      }
    }
    throw new Error('Failed to load page after 3 attempts');
  }
}
