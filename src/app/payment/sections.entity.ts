import {
  BaseEntity,
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/app/auth/user.entity';

@Entity()
export class Sections extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  sectionId: string;

  @Column()
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
