import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CreateWorkDto, UpdateWorkDto } from 'src/work/dto/work.dto';
import { Work } from 'src/work/entities/work.entity';
import { WorkService } from './work.service';
import { Receipt } from './entities/receipt.entity';

@Controller('work')
export class WorkController {
  constructor(private readonly workService: WorkService) {}

  @Get('client/:id')
  async getWorksByClient(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Work[]> {
    return await this.workService.findWorksByClient(id);
  }

  @Get('professional/:id')
  async getWorksByProfessional(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Work[]> {
    return await this.workService.findWorksByProfessional(id);
  }

  @Get()
  async getWorks(): Promise<Work[]> {
    return await this.workService.findWorks();
  }

  @Get('receipt/:id')
  async findReceiptByWorkId(@Param('id', ParseIntPipe) id: number): Promise<Receipt> {
    return await this.workService.findReceiptByWork(id);
  }

  @Get('receipt/professional/:id')
  async findReceiptsByProfessionalId(@Param('id', ParseIntPipe) id: number): Promise<Receipt[]> {
    return await this.workService.findReceiptsByProfessional(id);
  }

  @Post()
  async create(@Body() createWorkDto: CreateWorkDto): Promise<Work> {
    return this.workService.createWork(createWorkDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.workService.deleteWork(id);
  }

  @Put(':id')
  async update(@Body() updateWorkDto: UpdateWorkDto, @Param('id', ParseIntPipe) id: number): Promise<Work> {
    return await this.workService.update(id, updateWorkDto)
  }
}
