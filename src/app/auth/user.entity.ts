import { Column, Unique, OneToMany } from 'typeorm';
import { BaseEntity, Entity, PrimaryGeneratedColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Task } from 'src/app/tasks/task.entity';
import { Sections } from '../sections/sections.entity';
import { Languages } from '../languages/languages.entity';

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

  @OneToMany(() => Languages, (languages) => languages?.user, { eager: true })
  lang: Languages[];

  @OneToMany(() => Sections, (section) => section?.user, { eager: true })
  section: Sections[];

  @OneToMany(() => Task, (task) => task?.user, { eager: true })
  tasks: Task[];

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }
}
