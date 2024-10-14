import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findOneByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async register({ username, email, password }: RegisterDto, res: Response) {
    try {
      const user = await this.userService.findOneByEmail(email);

      if (user) throw new BadRequestException('User already exists');

      const registeredUser = await this.userService.create({
        username,
        email,
        password,
      });

      const payload = {
        username: registeredUser.username,
        email: registeredUser.email,
      };

      const token = this.jwtService.sign(payload, {
        secret: process.env.SECRET,
      });

      const refreshToken = this.jwtService.sign(payload, {
        secret: process.env.SECRET,
        expiresIn: '7d',
      });

      res.cookie('token', token, {
        httpOnly: true,
        // secure: true,
        path: '/',
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        // secure: true,
        path: '/',
      });

      console.log(registeredUser);

      res.send({
        username: registeredUser.username,
        email: registeredUser.email,
        token,
        refreshToken,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async login({ email, password }: LoginDto, res: Response) {
    try {
      const user = await this.userService.findOneByEmailWithPassword(email);

      if (!user) {
        throw new UnauthorizedException('Email is wrong');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Password is wrong');
      }

      const payload = {
        username: user.username,
        email: user.email,
      };

      const token = this.jwtService.sign(payload, {
        secret: process.env.SECRET,
      });

      const refreshToken = this.jwtService.sign(payload, {
        secret: process.env.SECRET,
        expiresIn: '7d',
      });

      res.cookie('token', token, {
        httpOnly: true,
        // secure: true,
        path: '/',
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        // secure: true,
        path: '/',
      });

      res.send({
        user: {username: user.username, email: user.email},
        token,
        refreshToken,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async refreshToken(user: User) {
    const payload = {
      username: user.username,
      email: user.email,
    };
    return {
      token: this.jwtService.sign(payload, {secret: process.env.SECRET}),
    };
  }
}
