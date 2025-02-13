import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { diskStorage } from 'multer';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { WorkPhoto } from './entities/work-photo.entity';

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
      throw new BadRequestException('No se seleccionó ningún archivo');
    }

    await this.uploadService.updateProfilePicture(id, profilePicture.filename);

    const fileUrl = `http://localhost:3000/uploads/pfp/${profilePicture.filename}`;
    return {
      url: fileUrl,
    };
  }

  @Post('work/:id')
  @UseInterceptors(
    FilesInterceptor('workPhotos', 10, {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const userId = req.params.id;
          const uploadPath = `./uploads/work/${userId}`;

          // Crear la carpeta si no existe
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }

          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const fileExtension = path.extname(file.originalname);
          const fileName = `${Date.now()}${fileExtension}`;
          callback(null, fileName);
        },
      }),
      fileFilter: (req, file, callback) => {
        // Validar que el archivo sea una imagen
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(
            new Error(
              'Solo se permiten archivos de imagen (jpg, jpeg, png, gif)',
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // Límite de 5MB por archivo
      },
    }),
  )
  async uploadWorkPhotos(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() workPhotos: Express.Multer.File[],
  ): Promise<any> {
    if (!workPhotos || workPhotos.length === 0) {
      throw new BadRequestException('No se seleccionaron archivos');
    }

    // Guardar las URLs de las imágenes subidas
    const fileUrls = workPhotos.map((file) => {
      return {
        filename: file.filename,
        url: `http://localhost:3000/uploads/work/${id}/${file.filename}`,
      };
    });

    // Aquí puedes guardar las URLs en la base de datos si es necesario
    await this.uploadService.saveWorkPhotos(id, fileUrls);

    return {
      message: 'Fotos subidas correctamente',
      files: fileUrls,
    };
  }

  @Get('work/:id')
  async getWorkPhotos(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WorkPhoto[]> {
    return await this.uploadService.getWorkPhotos(id);
  }

  @Delete(':id/:filename')
async deleteWorkPhoto(
  @Param('id', ParseIntPipe) id: number,
  @Param('filename') filename: string,
) {
  return await this.uploadService.deleteWorkPhoto(id, filename);
}

}
