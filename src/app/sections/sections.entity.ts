import { BaseEntity, Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Sections extends BaseEntity {
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

  @Column()
  userId: number;

  @Column()
  language: string;
}
