import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Request as RequestNest,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { RefreshJwtGuard } from './guard/refresh-jwt-auth.guard';
// import { JwtGuard } from './guard/jwt-auth.guard';
import { LocalAuthGuard } from './guard/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response): Promise<any> {
    return await this.authService.login(loginDto, res);
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res() res: Response,
  ): Promise<any> {
    return await this.authService.register(registerDto, res);
  }

  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  async refreshToken(@RequestNest() req, @Res() res: Response) {
    return await this.authService.refreshToken(req.user, res);
  }

  @Get('status')
  async checkAuthStatus(@Req() req: Request, @Res() res: Response) {
    return await this.authService.checkAuthStatus(req, res);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    return await this.authService.logout(req, res);
  }
}
