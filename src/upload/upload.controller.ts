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
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { diskStorage } from 'multer';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { WorkPhoto } from './entities/work-photo.entity';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  apiUrl = process.env.API_URL

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

    const fileUrl = `${this.apiUrl}/uploads/pfp/${profilePicture.filename}`;
    return {
      url: fileUrl,
    };
  }

  @Post('criminal-record/:id')
  @UseInterceptors(
    FileInterceptor('criminalRecord', {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const userId = req.params.id;
          const uploadPath = `./uploads/criminal-records/${userId}`;

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
        if (file.mimetype === 'application/pdf') {
          callback(null, true);
        } else {
          callback(new Error('Solo se permiten archivos PDF'), false);
        }
      },
    }),
  )
  async uploadCriminalRecord(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() criminalRecord: Express.Multer.File,
  ): Promise<any> {
    if (!criminalRecord) {
      throw new BadRequestException('No se seleccionó ningún archivo');
    }

    await this.uploadService.updateCriminalRecord(id, criminalRecord.filename);

    const fileUrl = `${this.apiUrl}/uploads/criminal-records/${id}/${criminalRecord.filename}`;
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
        fileSize: 5 * 1024 * 1024,
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

    const fileUrls = workPhotos.map((file) => {
      return {
        filename: file.filename,
        url: `${this.apiUrl}/uploads/work/${id}/${file.filename}`,
      };
    });

    await this.uploadService.saveWorkPhotos(id, fileUrls);

    return {
      message: 'Fotos subidas correctamente',
      files: fileUrls,
    };
  }

  @Post('dni/:id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'frontDni', maxCount: 1 },
        { name: 'backDni', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, callback) => {
            const userId = req.params.id;
            const uploadPath = `./uploads/dni/${userId}`;

            if (!existsSync(uploadPath)) {
              mkdirSync(uploadPath, { recursive: true });
            }

            callback(null, uploadPath);
          },
          filename: (req, file, callback) => {
            const fileExtension = path.extname(file.originalname);
            const fileName = `${Date.now()}-${file.fieldname}${fileExtension}`;
            callback(null, fileName);
          },
        }),
        fileFilter: (req, file, callback) => {
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
          fileSize: 5 * 1024 * 1024,
        },
      },
    ),
  )
  async uploadDniPhotos(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles()
    files: {
      frontDni?: Express.Multer.File[];
      backDni?: Express.Multer.File[];
    },
  ): Promise<any> {
    if (!files.frontDni || !files.backDni) {
      throw new BadRequestException(
        'Debes subir tanto el frente como el dorso del DNI.',
      );
    }

    const frontDniFile = files.frontDni[0];
    const backDniFile = files.backDni[0];

    const fileUrls = {
      frontDni: `${this.apiUrl}/uploads/dni/${id}/${frontDniFile.filename}`,
      backDni: `${this.apiUrl}/uploads/dni/${id}/${backDniFile.filename}`,
    };

    const result = await this.uploadService.saveDniPhotos(id, fileUrls);

    return result;
  }

  @Get('work/:id')
  async getWorkPhotos(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WorkPhoto[]> {
    return await this.uploadService.getWorkPhotos(id);
  }

  @Get('dni/:id')
  async getDniPhotos(@Param('id', ParseIntPipe) id: number) {
    return await this.uploadService.getDniPhotos(id)
  }

  @Delete(':id/:filename')
  async deleteWorkPhoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('filename') filename: string,
  ) {
    return await this.uploadService.deleteWorkPhoto(id, filename);
  }
}
