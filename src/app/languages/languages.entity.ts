import { BaseEntity, Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { User } from 'src/app/auth/user.entity';

@Entity()
export class Languages extends BaseEntity {
  @PrimaryColumn()
  language: string;

  @Column()
  name: string;

  @ManyToOne(() => User, (user) => user.lang, { eager: false })
  user: User;

  @Column()
  userId: number;
}
