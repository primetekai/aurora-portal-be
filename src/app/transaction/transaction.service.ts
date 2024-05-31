import { Injectable } from '@nestjs/common';
import { Transaction } from './transaction.entity';
import { TransactionStatus } from './transaction-status.emum';
import { TransactionsRepository } from './transaction.repository';
import { User } from '@app/auth';

@Injectable()
export class TransactionService {
  constructor(private transactionRepository: TransactionsRepository) {}

  async getTransaction(): Promise<Transaction[]> {
    const sections = await this.transactionRepository.getTransactions();

    return sections;
  }

  async createTransaction(
    orderId: string,
    amount: number,
    status: TransactionStatus,
    user: User,
  ): Promise<Transaction> {
    return this.transactionRepository.createTransaction(
      orderId,
      amount,
      status,
      user,
    );
  }

  async updateTransactionStatus(
    id: string,
    status: TransactionStatus,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    transaction.status = status;
    return await this.transactionRepository.save(transaction);
  }
}
