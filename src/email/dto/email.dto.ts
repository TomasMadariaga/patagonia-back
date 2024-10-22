import { IsEmail, IsString } from 'class-validator';

export class EmailDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  message: string;
}
