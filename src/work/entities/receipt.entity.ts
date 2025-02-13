import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Work } from "./work.entity";
import { paymentMethod } from "../enum/paymentMethod.enum";

@Entity()
export class Receipt {

  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', {unique: true})
  budgetNumber: number;

  @Column()
  service: string;

  @Column()
  description: string;

  @Column()
  address: string;

  @Column()
  value: number;

  @Column()
  commission: number;

  @Column('enum', { enum: paymentMethod })
  paymentMethod: paymentMethod;

  @OneToOne(() => Work, (work) => work.receipt, {onDelete: 'CASCADE'})
  @JoinColumn()
  work: Work;
}