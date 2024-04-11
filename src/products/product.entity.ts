import { User } from 'src/auth/user.entity';
import { JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  product_img: string;

  @Column()
  product_name: string;

  @Column()
  product_description: string;

  @Column()
  product_price: number;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @ManyToOne((type) => User, (user) => user.product, { eager: false })
  @JoinColumn()
  user: User;

  @Column()
  userId: number;
  static user: any;
}
