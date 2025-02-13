import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { JwtGuard } from 'src/auth/guard/jwt-auth.guard';
import { Role } from './enum/role.enum';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/role.decorator';
import { Request } from 'express';
import { UpdateUserDto } from './dto/user.dto';
import { Work } from '../work/entities/work.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(): Promise<User[]> {
    return await this.userService.findAll();
  }

  @Get('professionals')
  async findProfessionals(): Promise<User[]> {
    return await this.userService.findProfessionals();
  }

  @Get('clients')
  async findClients(): Promise<User[]> {
    return await this.userService.findClients();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return await this.userService.findOne(id);
  }

  @Put(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.delete(id);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Put('rate/:id')
  @Roles(Role.Cliente)
  async rateProfessional(
    @Param('id', ParseIntPipe) id: number,
    @Body('rating') rating: number,
    @Req() req: Request,
  ) {
    if (!rating || rating < 1 || rating > 5) {
      throw new Error('La calificación debe estar entre 1 y 5.');
    }
    return await this.userService.rateProfessional(id, rating, req);
  }
}
