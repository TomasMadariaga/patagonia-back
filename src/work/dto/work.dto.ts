import { PartialType } from "@nestjs/mapped-types";
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { paymentMethod } from "../enum/paymentMethod.enum";
import { status } from "../enum/status.enum";

export class CreateWorkDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  value: number;

  @IsNumber()
  @Min(0)
  commission: number;

  @IsInt()
  @Min(0)
  budgetNumber: number;

  @IsInt()
  clientId: number;

  @IsString()
  @IsOptional()
  @IsEnum(status)
  status?: status;

  @IsEnum(paymentMethod)
  paymentMethod: paymentMethod;

  @IsInt()
  projectLeaderId: number;
}

export class UpdateWorkDto extends PartialType(CreateWorkDto) {}