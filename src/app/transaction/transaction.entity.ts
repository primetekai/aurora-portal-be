import {
  BaseEntity,
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TransactionStatus } from './transaction-status.emum';
import { User } from '../user';

@Entity()
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  amount: number;

  @Column()
  status: TransactionStatus;

  @Column()
  createAt: Date;

  @ManyToOne(() => User, (user) => user.section, { eager: false })
  user: User;

  @Column()
  userId: number;
}
