import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { In, Not, Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { Role } from './enum/role.enum';
import { Vote } from './entities/vote.entity';
import * as fs from 'fs';
import * as path from 'path';
import { Work } from '../work/entities/work.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Vote) private readonly voteRepository: Repository<Vote>,
  ) {}

  async findAll() {
    return await this.userRepository.find();
  }

  async findProfessionals(): Promise<User[]> {
    const professionals = await this.userRepository.find({
      where: {
        role: Not(In([Role.Cliente, Role.Admin])),
      },
      select: [
        'id',
        'name',
        'lastname',
        'email',
        'profilePicture',
        'rating',
        'role',
        'totalVotes',
      ],
    });
    return professionals;
  }

  async findClients(): Promise<User[]> {
    const clients = await this.userRepository.find({
      where: {
        role: Not(
          In([
            Role.Admin,
            Role.Albañil,
            Role.Carpintero,
            Role.Herrero,
            Role.Pintor,
            Role.Singuero,
          ]),
        ),
      },
      select: [
        'id',
        'name',
        'lastname',
        'email',
        'profilePicture',
        'rating',
        'role',
        'totalVotes',
      ],
    });

    return clients;
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return user;
  }

  async findOneByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findOneByEmailWithPassword(email: string) {
    return await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'name', 'role', 'lastname', 'password'],
    });
  }

  async findOneByResetPasswordToken(resetPasswordToken: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new Error('User not found');
    }

    Object.assign(user, updateUserDto);

    return this.userRepository.save(user);
  }

  async deleteProfilePicture(filename: string): Promise<void> {
    const filePath = path.join(
      __dirname,
      '..',
      '..',
      'uploads',
      'pfp',
      filename,
    );

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      } else {
        throw new HttpException(
          'Profile picture not found',
          HttpStatus.NOT_FOUND,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete profile picture',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(id: number) {
    const userFound = await this.userRepository.findOne({ where: { id } });

    if (!userFound)
      return new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (userFound.profilePicture) {
      await this.deleteProfilePicture(userFound.profilePicture);
    }

    return this.userRepository.delete({ id: userFound.id });
  }

  async findProfilePicture(file) {
    const fileUrl = `http://localhost:3000/uploads/${file.filename}`;
    return {
      url: fileUrl,
    };
  }

  async rateProfessional(id: number, rating: number, req) {
    const professional = await this.userRepository.findOne({ where: { id } });
    const user = await this.userRepository.findOne({
      where: { id: req.user.id },
    });

    if (!professional) {
      throw new HttpException(
        'Profesional no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    const existingVote = await this.voteRepository.findOne({
      where: { user: { id: user.id }, professional: { id: id } },
    });

    if (existingVote) {
      throw new HttpException(
        'Ya has votado por este profesional',
        HttpStatus.FORBIDDEN,
      );
    }

    const vote = this.voteRepository.create({
      user: user,
      professional: professional,
      rating: rating,
    });

    await this.voteRepository.save(vote);

    const votes = await this.voteRepository.find({
      where: { professional: { id } },
    });
    const totalVotes = votes.length;
    const totalRating = votes.reduce((acc, vote) => acc + vote.rating, 0);
    const averageRating = totalRating / totalVotes;

    professional.rating = averageRating;
    professional.totalVotes = totalVotes;

    const savedProfessional = await this.userRepository.save(professional);

    const { lastname, email, password, ...updatedProfessional } =
      savedProfessional;
    return updatedProfessional;
  }
}
