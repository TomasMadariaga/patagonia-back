import { IsEmail, IsOptional, IsString } from 'class-validator';

export class EmailDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  message: string;

  @IsOptional()
  attachments: { name: string; content: string }[];
}
