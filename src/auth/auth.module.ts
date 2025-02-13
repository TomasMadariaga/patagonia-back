import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { RefreshJwtStrategy } from './strategies/refreshToken.strategy';
import { JwtStrategy } from './strategies/jwt-strategy';
import { LocalStrategy } from './strategies/local-strategy';
import { Vote } from 'src/user/entities/vote.entity';
import { Work } from 'src/work/entities/work.entity';

@Module({
  controllers: [AuthController],
  providers: [AuthService, UserService, RefreshJwtStrategy, JwtStrategy, LocalStrategy],
  imports: [
    TypeOrmModule.forFeature([User, Vote, Work]),
    JwtModule.register({
      secret: `${process.env.SECRET}`,
      signOptions: { expiresIn: '15m' },
    }),
  ],
})
export class AuthModule {}
