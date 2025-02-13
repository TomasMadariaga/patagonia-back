import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsString, Min } from "class-validator";
import { paymentMethod } from "../enum/paymentMethod.enum";

export class createReceiptDto {
  
  @IsInt()
  workId: number;

  @IsString()
  @IsNotEmpty()
  service: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  budgetNumber: number;

  @IsString()
  address: string;

  @IsNumber()
  @Min(0)
  value: number;

  @IsNumber()
  @Min(0)
  commission: number;

  @IsString()
  @IsEnum(paymentMethod)
  paymentMethod: paymentMethod;
}