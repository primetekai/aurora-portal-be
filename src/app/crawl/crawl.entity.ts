import { BaseEntity, Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Crawl extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  data: string;

  @Column()
  createAt: Date;
}
