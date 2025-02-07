import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findOneByEmail(email);
    if (!user) throw new HttpException('Email incorrecto', HttpStatus.UNAUTHORIZED)
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    throw new HttpException('Contraseña incorrecta', HttpStatus.UNAUTHORIZED)
    // return null;
  }

  async register(
    { name, lastname, email, password, role, profilePicture }: RegisterDto,
    res: Response,
  ) {
    try {
      const user = await this.userService.findOneByEmail(email);

      if (user) throw new BadRequestException('El usuario ya existe');

      const registeredUser = await this.userService.create({
        name,
        lastname,
        email,
        password,
        role,
        profilePicture,
      });

      const payload = {
        id: registeredUser.id,
        name: registeredUser.name,
        email: registeredUser.email,
        role: registeredUser.role,
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
        sameSite: 'strict',
        path: '/',
        maxAge: 1000 * 60 * 15,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        // secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      const expiresIn = 900;
      const expirationDate = new Date(Date.now() + expiresIn * 1000);

      res.send({
        id: registeredUser.id,
        name: registeredUser.name,
        lastname: registeredUser.lastname,
        email: registeredUser.email,
        role: registeredUser.role,
        profilePicture: registeredUser.profilePicture,
        expiresIn,
        expirationDate
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async login({ email, password }: LoginDto, res: Response) {
    try {
      const user = await this.userService.findOneByEmailWithPassword(email);
      if (!user) {
        throw new HttpException('Email is wrong', HttpStatus.UNAUTHORIZED);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new HttpException('password is wrong', HttpStatus.UNAUTHORIZED);
      }

      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      const token = this.jwtService.sign(payload, {
        secret: process.env.SECRET,
      });

      const refreshToken = this.jwtService.sign(payload, {
        secret: process.env.SECRET,
        expiresIn: '7d',
      });

      const expiresIn = 900;
      const expirationDate = new Date(Date.now() + expiresIn * 1000);

      res.cookie('token', token, {
        httpOnly: true,
        // secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 1000 * 60 * 15,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        // secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      res.send({
        user: {
          id: user.id,
          name: user.name,
          lastname: user.lastname,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          expiresIn,
          expirationDate
        },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async refreshToken(user: User, res: Response) {
    try {
      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
      const token = this.jwtService.sign(payload, {
        secret: process.env.SECRET,
      });

      res.cookie('token', token, {
        httpOnly: true,
        // secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 1000 * 60 * 15,
      });
      res.send({ token });
    } catch (error) {
      console.log(error);
    }
  }

  async checkAuthStatus(req: Request, res: Response) {
    if (req.tokenExpired) {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (!req.user) {
      return res.status(403).json({ message: 'User not authenticated' });
    }
    return res.status(200).json({ user: req.user });
  }

  async logout(req: Request, res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });

    res.status(200).send({ message: 'Logged out successfully' });
  }
}
