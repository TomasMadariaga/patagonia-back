import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Vote } from 'src/user/entities/vote.entity';
import { MulterModule } from '@nestjs/platform-express';
import { WorkPhoto } from './entities/work-photo.entity';
import { Work } from 'src/work/entities/work.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Vote, WorkPhoto, Work]),
    MulterModule.register({
      dest: './uploads',
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService, UserService],
  exports: [UploadService],
})
export class UploadModule {}
