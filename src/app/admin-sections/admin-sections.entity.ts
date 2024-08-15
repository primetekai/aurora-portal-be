import {
  BaseEntity,
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user';

@Entity()
export class AdminSections extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  sectionId: string;

  @Column('text')
  section: string;

  @Column()
  data: string;

  @Column()
  createAt: Date;

  @Column()
  version: number;

  @ManyToOne(() => User, (user) => user.section, { eager: false })
  user: User;

  @Column()
  userId: number;

  @Column()
  language: string;
}
