import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Receipt } from './receipt.entity';
import { paymentMethod } from '../enum/paymentMethod.enum';
import { status } from '../enum/status.enum';

@Entity()
export class Work {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;

  @Column()
  service: string;

  @Column()
  description: string;

  @Column()
  value: number;

  @Column()
  commission: number;

  @Column({ type: 'enum', enum: paymentMethod })
  paymentMethod: paymentMethod;

  @Column({ type: 'enum', enum: status, default: status.Pending })
  status: status;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  public createdAt: Date;

  @ManyToOne(() => User, (user) => user.works)
  client: User;

  @ManyToOne(() => User, (user) => user.works)
  @JoinColumn({ name: 'projectLeader' })
  projectLeader: User;

  @OneToOne(() => Receipt, (receipt) => receipt.work)
  receipt: Receipt;
}
