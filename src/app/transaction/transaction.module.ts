import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsRepository } from './transaction.repository';
import { AuthModule } from 'src/app/auth/auth.module';
import { LanguagesService } from '../languages/languages.service';
import { LanguagesRepository } from '../languages/languages.repository';
import { HttpModule } from '@nestjs/axios';
import { MomoPaymentService } from './momo-payment.service';
import { PaymentController } from './payment.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionsRepository, LanguagesRepository]),
    AuthModule,
    HttpModule,
  ],
  controllers: [TransactionController, PaymentController],
  providers: [
    TransactionService,
    TransactionsRepository,
    LanguagesService,
    LanguagesRepository,
    MomoPaymentService,
  ],
})
export class TransactionModule {}
