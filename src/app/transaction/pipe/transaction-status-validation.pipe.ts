import { PipeTransform, BadRequestException } from '@nestjs/common';
import { TransactionStatus } from '../transaction-status.emum';

export class TransactionStatusValidationPipe implements PipeTransform {
  readonly allowedStatuses = [
    TransactionStatus.FALSE,
    TransactionStatus.INPROGRESS,
    TransactionStatus.PENDING,
    TransactionStatus.REJECT,
    TransactionStatus.SUCCESS,
  ];

  transform(value: any) {
    if (!this.isStatusValid(value)) {
      throw new BadRequestException(`"${value}" is am invalid status`);
    }
    return value;

    value = value.toUpperCase();
    return value;
  }
  private isStatusValid(status: any) {
    const idx = this.allowedStatuses.indexOf(status);
    return idx !== -1;
  }
}
