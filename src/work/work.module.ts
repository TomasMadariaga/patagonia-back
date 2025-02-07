import { Module } from '@nestjs/common';
import { WorkController } from './work.controller';
import { WorkService } from './work.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Work } from './entities/work.entity';
import { Receipt } from './entities/receipt.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Work, Receipt])],
  controllers: [WorkController],
  providers: [WorkService]
})
export class WorkModule {}
