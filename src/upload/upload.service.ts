import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Role } from 'src/user/enum/role.enum';
import { Repository } from 'typeorm';
import { WorkPhoto } from './entities/work-photo.entity';
import { CreateWorkPhotoDto } from './dto/work-photo.dto';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(WorkPhoto)
    private readonly workPhotoRepository: Repository<WorkPhoto>,
  ) {}

  async updateProfilePicture(userId: number, filePath: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }
    user.profilePicture = filePath;
    const updatedUser = await this.userRepository.save(user);
    return updatedUser;
  }

  async uploadWorkPhoto(id: number, workPhotoDto: CreateWorkPhotoDto) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    if (user.role === Role.Cliente) {
      throw new HttpException(
        'Los clientes no pueden subir fotos de trabajos',
        HttpStatus.FORBIDDEN,
      );
    }

    const workPhoto = this.workPhotoRepository.create({
      url: workPhotoDto.url,
      description: workPhotoDto.description,
    });

    return await this.workPhotoRepository.save(workPhoto);
  }
}
