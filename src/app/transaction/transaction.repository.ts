import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { User } from 'src/app/auth/user.entity';
import { Logger } from '@nestjs/common/services/logger.service';
import * as moment from 'moment';
import { TransactionStatus } from './transaction-status.emum';

@Injectable()
export class TransactionsRepository extends Repository<Transaction> {
  constructor(private dataSource: DataSource) {
    super(Transaction, dataSource.createEntityManager());
  }

  private logger = new Logger('Transaction repository');

  async getTransactions(): Promise<Transaction[]> {
    const query = this.createQueryBuilder('transaction');

    try {
      const sections = await query.getMany();

      return sections;
    } catch (error) {
      this.logger.error(`Failed to get transaction`, error.stack);
      throw new InternalServerErrorException();
    }
  }

  async createTransaction(
    orderId: string,
    amount: number,
    status: TransactionStatus,
    user: User,
  ): Promise<Transaction> {
    const lg = new Transaction();
    lg.status = status;
    lg.amount = amount;
    lg.orderId = orderId;
    lg.createAt = new Date(moment().format('YYYY-MM-DD HH:mm:ss'));
    lg.user = user;

    try {
      await lg.save();
    } catch (error) {
      this.logger.error(`Failed transaction`, error.stack);
      throw new InternalServerErrorException();
    }
    delete lg.user;
    return lg;
  }
}
