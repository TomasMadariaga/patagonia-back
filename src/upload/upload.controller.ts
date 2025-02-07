import {
  BadRequestException,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { diskStorage } from 'multer';
import * as path from 'path';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('profile/:id')
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      storage: diskStorage({
        destination: './uploads/pfp',
        filename: (req, file, callback) => {
          const fileExtension = path.extname(file.originalname);
          const fileName = Date.now() + fileExtension;
          callback(null, fileName);
        },
      }),
    }),
  )
  async uploadProfilePicture(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() profilePicture: Express.Multer.File,
  ): Promise<any> {
    if (!profilePicture) {
      console.log('no hay')
      throw new BadRequestException('No se seleccionó ningún archivo');
    }

    await this.uploadService.updateProfilePicture(id, profilePicture.filename);

    const fileUrl = `http://localhost:3000/uploads/pfp/${profilePicture.filename}`;
    return {
      url: fileUrl,
    };
  }
}
