import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';
import { MOMO_ACCESS_KEY, MOMO_SECRET_KEY } from 'src/config';

@Injectable()
export class MomoPaymentService {
  private readonly partnerCode = 'MOMO';
  private readonly accessKey = MOMO_ACCESS_KEY;
  private readonly secretKey = MOMO_SECRET_KEY;
  private readonly redirectUrl =
    'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b';

  constructor(private httpService: HttpService) {}

  async initiatePayment(orderId: string, amount: number, url: string) {
    const requestType = 'payWithMethod';
    const orderInfo = 'pay with MoMo';
    const requestId = `${this.partnerCode}${new Date().getTime()}`;
    const extraData = '';
    const autoCapture = true;
    const lang = 'vi';
    const ipnUrl = `${url}/callback`;

    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${this.redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = JSON.stringify({
      partnerCode: this.partnerCode,
      partnerName: 'Test',
      storeId: 'MomoTestStore',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: this.redirectUrl,
      ipnUrl: ipnUrl,
      lang,
      requestType,
      autoCapture,
      extraData,
      signature,
    });

    const response = await lastValueFrom(
      this.httpService.post(
        'https://test-payment.momo.vn/v2/gateway/api/create',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data;
  }
}
