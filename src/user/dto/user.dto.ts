import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../enum/role.enum';

export class CreateUserDto {

  @MinLength(3)
  @IsString()
  name: string;

  @MinLength(3)
  @IsString()
  lastname: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  phone: string;

  @IsString()
  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsString()
  profilePicture: string;

  @IsOptional()
  @IsString()
  frontDni: string;

  @IsOptional()
  @IsString()
  backDni: string;

  @IsOptional()
  @IsString()
  criminalRecord: string;

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsNumber()
  totalVotes?: number;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
