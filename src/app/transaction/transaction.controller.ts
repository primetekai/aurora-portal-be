import { TransactionService } from './transaction.service';
import {
  Body,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PAYMENT_SERVICE } from 'src/config';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user-role.emum';
import { TransactionStatusValidationPipe } from './pipe/transaction-status-validation.pipe';
import { TransactionStatus } from './transaction-status.emum';

@Controller(PAYMENT_SERVICE)
@ApiTags('transactions')
export class TransactionController {
  private logger = new Logger('TransactionController');

  constructor(private transactionService: TransactionService) {}
  @ApiBearerAuth()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all transaction' })
  @ApiResponse({ status: 200, description: 'Return all transaction.' })
  @Get()
  async getTransaction(@Res() res) {
    try {
      const data = await this.transactionService.getTransaction();
      return res.status(HttpStatus.OK).json(data);
    } catch (e) {
      return e;
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update status transaction' })
  @ApiResponse({ status: 200, description: 'Update status success.' })
  @Patch(':id/status')
  async updateTransactionStatus(
    @Param('id') id: string,
    @Body('status', TransactionStatusValidationPipe) status: TransactionStatus,
    @Res() res,
  ) {
    try {
      const data = await this.transactionService.updateTransactionStatus(
        id,
        status,
      );
      return res.status(HttpStatus.OK).json(data);
    } catch (e) {
      return e;
    }
  }
}
