import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from 'src/user/enum/role.enum';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(3)
  lastname: string;

  @IsEmail()
  @MinLength(1)
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  role?: Role;

  @IsOptional()
  @IsString()
  profilePicture: string;

  @Transform(({ value }) => value.trim())
  @IsString()
  @MinLength(6)
  password: string;
}
