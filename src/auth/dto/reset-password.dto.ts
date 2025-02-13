import { IsNotEmpty, IsUUID, Length } from "class-validator";

export class ResetPasswordDto {

  @IsUUID('4')
  @IsNotEmpty()
  resetPasswordToken: string;

  @IsNotEmpty()
  @Length(6, 20)
  password:string;
}