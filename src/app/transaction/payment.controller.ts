import { TransactionService } from './transaction.service';
import {
  Body,
  Logger,
  NotFoundException,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MOMO_ACCESS_KEY, MOMO_SECRET_KEY, PAYMENT_SERVICE } from 'src/config';
import { MomoPaymentService } from './momo-payment.service';
import { TransactionStatus } from './transaction-status.emum';
import * as crypto from 'crypto';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { Roles, RolesGuard, UserRole } from '../auth';
import { GetUser, User } from '../user';

@Controller(PAYMENT_SERVICE)
@ApiTags('payment')
export class PaymentController {
  private logger = new Logger('TransactionController');
  httpService: any;

  constructor(
    private momoPaymentService: MomoPaymentService,
    private transactionService: TransactionService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Checkout' })
  @ApiResponse({ status: 200, description: 'Checkout success.' })
  @Get('/checkout')
  async checkout(
    @Query('orderId') orderId: string,
    @Query('amount') amount: number,
    @Query('url') url: string,
    @GetUser() user: User,
    @Res() res,
  ) {
    try {
      const transaction = await this.transactionService.createTransaction(
        orderId,
        amount,
        TransactionStatus.NEW,
        user,
      );

      const response = await this.momoPaymentService.initiatePayment(
        transaction.id,
        amount,
        url,
      );

      const { resultCode, payUrl } = response;

      if (resultCode !== 0 || !payUrl) {
        throw new NotFoundException('Payment initiation failed');
      }

      return res.status(200).json({ payUrl });
    } catch (error) {
      return res.status(500).json({ statusCode: 500, message: error.message });
    }
  }

  @Post('callback')
  async handleNotify(@Body() notifyData: any) {
    try {
      const { orderId, resultCode } = notifyData;

      const transactionStatus =
        resultCode === 0
          ? TransactionStatus.INPROGRESS
          : TransactionStatus.FALSE;

      await this.transactionService.updateTransactionStatus(
        orderId,
        transactionStatus,
      );

      return {
        success: true,
        message: 'Transaction status updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update transaction status',
        error: error.message,
      };
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Checkout' })
  @ApiResponse({ status: 200, description: 'Checkout success.' })
  @Post('/check-status-transaction')
  async checkStatusTransaction(
    @Query('orderId') orderId: string,
    @GetUser() user: User,
    @Res() res,
  ) {
    try {
      const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&orderId=${orderId}&partnerCode=MOMO&requestId=${orderId}`;

      const signature = crypto
        .createHmac('sha256', MOMO_SECRET_KEY)
        .update(rawSignature)
        .digest('hex');

      const requestBody = JSON.stringify({
        partnerCode: 'MOMO',
        requestId: orderId,
        orderId: orderId,
        signature: signature,
        lang: 'vi',
      });

      const response: AxiosResponse<any> = await lastValueFrom(
        this.httpService.post(
          'https://test-payment.momo.vn/v2/gateway/api/query',
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      return res.status(200).json(response?.data);
    } catch (error) {
      return res.status(500).json({ statusCode: 500, message: error.message });
    }
  }
}
