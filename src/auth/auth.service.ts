import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findOneByEmail(email);
    if (!user)
      throw new HttpException('Email incorrecto', HttpStatus.UNAUTHORIZED);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    throw new HttpException('Contraseña incorrecta', HttpStatus.UNAUTHORIZED);
    // return null;
  }

  async register(
    {
      name,
      lastname,
      email,
      password,
      phone,
      role,
      profilePicture,
      frontDni,
      backDni,
      criminalRecord
    }: RegisterDto,
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
        phone,
        role,
        profilePicture,
        frontDni,
        backDni,
        criminalRecord
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
        expirationDate,
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
          expirationDate,
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
      throw new Error(error)
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

  async requestResetPassword(
    requestResetPasswordDto: RequestResetPasswordDto,
  ): Promise<void> {
    const { email } = requestResetPasswordDto;
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    user.generateResetPasswordToken()
    await this.userRepository.save(user);

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${user.resetPasswordToken}`;

    await this.sendResetEmail(user.email, resetLink);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { resetPasswordToken, password} = resetPasswordDto;

    const user = await this.userService.findOneByResetPasswordToken(resetPasswordToken);

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpires = null;

    this.userRepository.save(user)
  }

  private async sendResetEmail(email: string, resetLink: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: `${process.env.USER_EMAIL}`,
        pass: `${process.env.USER_PASSWORD}`,
      },
    });

    await transporter.sendMail({
      from: `${process.env.USER_EMAIL}`,
      to: email,
      subject: "🔑 Restablece tu contraseña",
      html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border-radius: 10px; background: #f9f9f9; text-align: center; border: 1px solid #ddd; 
      box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #333;">¿Olvidaste tu contraseña?</h2>
      <p style="color: #555;">No te preocupes, puedes restablecerla haciendo clic en el botón de abajo.</p>
      <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; margin: 10px 0; font-size: 16px; color: #fff; background: #007BFF; text-decoration: none; border-radius: 5px;">
        Restablecer contraseña
      </a>
      <p style="color: #777; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
      <p style="color: #aaa; font-size: 12px;">© ${new Date().getFullYear()} Cruz Patagonia - Todos los derechos reservados</p>
    </div>`
    });
  }
}
