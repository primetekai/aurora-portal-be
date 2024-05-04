import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { TaskStatus } from './task-status.enum';
import { User } from 'src/app/auth/user.entity';

@Entity()
export class Task extends BaseEntity {
  // @PrimaryGeneratedColumn('uuid')
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  status: TaskStatus;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @ManyToOne((type) => User, (user) => user.tasks, { eager: false })
  user: User;

  @Column()
  userId: number;
}
