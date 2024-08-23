import { BaseEntity, Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Languages extends BaseEntity {
  @PrimaryColumn()
  language: string;

  @Column()
  name: string;

  @Column()
  userId: number;
}
