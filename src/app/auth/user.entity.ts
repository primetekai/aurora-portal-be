import { Product } from '../products/product.entity';
import { Column, Unique, OneToMany } from 'typeorm';
import { BaseEntity, Entity, PrimaryGeneratedColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Task } from 'src/app/tasks/task.entity';
@Entity()
@Unique(['username'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  salt: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToMany((type) => Task, (task) => task.user, { eager: true })
  tasks: Task[];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToMany((type) => Product, (product) => Product.user, { eager: false })
  product: Product[];

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }
}
