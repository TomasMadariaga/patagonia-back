import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { MulterModule } from '@nestjs/platform-express';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Vote } from './entities/vote.entity';
import { Work } from '../work/entities/work.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Vote, Work]),
    MulterModule.register({
      dest: './uploads',
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  ],
  providers: [UserService, {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
