import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';

export class CreateWorkPhotoDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateWorkPhotoDto extends PartialType(CreateWorkPhotoDto) {}
