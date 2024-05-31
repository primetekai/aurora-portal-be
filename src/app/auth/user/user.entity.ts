import { Column, Unique, OneToMany } from 'typeorm';
import { BaseEntity, Entity, PrimaryGeneratedColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Languages, Sections } from 'src/app';

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

  @Column()
  role: string;

  @OneToMany(() => Languages, (languages) => languages?.user, { eager: true })
  lang: Languages[];

  @OneToMany(() => Sections, (section) => section?.user, { eager: true })
  section: Sections[];

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }
}
