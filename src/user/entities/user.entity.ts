import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import * as bcrypt from 'bcrypt';
import { Role } from "../enum/role.enum";
import { Vote } from "./vote.entity";
import { WorkPhoto } from "../../upload/entities/work-photo.entity";
import { Work } from "../../work/entities/work.entity";
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class User {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  lastname: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  phone: string;

  @Column({ type: 'enum', enum: Role, default: Role.Cliente })
  role: Role;

  @Column({ default: 0 })
  rating: number;

  @Column({ default: 0 })
  totalVotes: number;

  @Column({ type: 'uuid', unique: true, name: 'reset_password_token', nullable: true })
  resetPasswordToken: string;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordTokenExpires: Date;

  @OneToMany(() => Vote, (vote) => vote.user)
  votes: Vote[];

  @OneToMany(() => Vote, (vote) => vote.professional)
  professionals: Vote[];

  @OneToMany(() => Work, (work) => work.client)
  works: Work[];

  @OneToMany(() => WorkPhoto, (workPhoto) => workPhoto.user, { nullable: true })
  workPhotos: WorkPhoto[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (!this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  generateResetPasswordToken() {
    this.resetPasswordToken = uuidv4();
    this.resetPasswordTokenExpires = new Date(Date.now() + 3600000);
  }
}