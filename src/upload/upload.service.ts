import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { WorkPhoto } from './entities/work-photo.entity';
import { UserService } from 'src/user/user.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(WorkPhoto)
    private readonly workPhotoRepository: Repository<WorkPhoto>,
    private readonly userService: UserService,
  ) {}

  async updateProfilePicture(userId: number, filePath: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }
    if (user.profilePicture) {
      await this.userService.deleteProfilePicture(user.profilePicture);
    }
    user.profilePicture = filePath;
    const updatedUser = await this.userRepository.save(user);
    return updatedUser;
  }

  async saveWorkPhotos(
    userId: number,
    fileUrls: Array<{ filename: string; url: string }>,
  ) {
    const workPhotos = fileUrls.map((file) => {
      return this.workPhotoRepository.create({
        filename: file.filename,
        url: file.url,
        userId,
      });
    });

    await this.workPhotoRepository.save(workPhotos);
  }

  async getWorkPhotos(id: number): Promise<WorkPhoto[]> {
    const workPhotos = await this.workPhotoRepository.find({
      where: { userId: id },
    });

    if (!workPhotos) {
      throw new HttpException('Work photos not found', HttpStatus.NOT_FOUND);
    }

    return workPhotos;
  }

  async deleteWorkPhoto(userId: number, filename: string) {
    if (!userId || !filename) {
      throw new HttpException('Missing parameters', HttpStatus.BAD_REQUEST);
    }

    const photoFound = await this.workPhotoRepository.findOne({
      where: { userId, filename },
    });

    if (!photoFound) {
      throw new HttpException('Work photo not found in database', HttpStatus.NOT_FOUND);
    }

    const id = String(userId);
    const filePath = path.join(
      __dirname,
      '..',
      '..',
      'uploads',
      'work',
      id,
      filename,
    );

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      } else {
        throw new HttpException('Work photo not found on disk', HttpStatus.NOT_FOUND);
      }

      await this.workPhotoRepository.remove(photoFound);

      return { message: 'Work photo deleted successfully' };
    } catch (error) {
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
