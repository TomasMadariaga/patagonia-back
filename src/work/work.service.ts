import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateWorkDto, UpdateWorkDto } from 'src/work/dto/work.dto';
import { User } from 'src/user/entities/user.entity';
import { Work } from 'src/work/entities/work.entity';
import { Repository } from 'typeorm';
import { createReceiptDto } from './dto/receipt.dto';
import { Receipt } from './entities/receipt.entity';

@Injectable()
export class WorkService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Work) private readonly workRepository: Repository<Work>,
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
  ) {}

  async createReceipt({
    workId,
    address,
    budgetNumber,
    value,
    commission,
    paymentMethod,
    service,
    description,
  }: createReceiptDto) {
    try {
      const workFounded = await this.workRepository.findOne({
        where: { id: workId },
      });

      if (!workFounded) {
        throw new HttpException('Work not found', HttpStatus.NOT_FOUND);
      }

      const receipt = this.receiptRepository.create({
        address,
        budgetNumber,
        value,
        commission,
        paymentMethod,
        work: workFounded,
        service,
        description,
      });
      await this.receiptRepository.save(receipt);
      return receipt;
    } catch (error) {
      throw new Error(error)
    }
  }

  async createWork({
    address,
    service,
    description,
    value,
    commission,
    clientId,
    paymentMethod,
    status,
    budgetNumber,
    projectLeaderId,
  }: CreateWorkDto): Promise<Work> {
    try {
      const client = await this.userRepository.findOne({
        where: { id: clientId },
        select: ['id', 'name', 'lastname', 'email'],
      });
      if (!client) {
        throw new HttpException('Client not found', HttpStatus.NOT_FOUND);
      }
  
      const projectLeader = await this.userRepository.findOne({
        where: { id: projectLeaderId },
        select: ['id', 'name', 'lastname', 'role', 'profilePicture', 'rating', 'totalVotes'],
      });
      if (!projectLeader) {
        throw new HttpException('Project leader not found', HttpStatus.NOT_FOUND);
      }
  
      const existingReceipt = await this.receiptRepository.findOne({
        where: { budgetNumber },
      });
  
      if (existingReceipt) {
        throw new HttpException('Budget number already exists', HttpStatus.CONFLICT);
      }
  
      const newWork = this.workRepository.create({
        address,
        service,
        description,
        value,
        commission,
        client,
        paymentMethod,
        projectLeader,
        status,
      });
  
      const savedWork = await this.workRepository.save(newWork);
  
      await this.createReceipt({
        workId: savedWork.id,
        address,
        service,
        description,
        budgetNumber,
        value,
        commission,
        paymentMethod,
      });
  
      return savedWork;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  

  async findWorksByClient(id: number): Promise<Work[]> {
    const work = await this.workRepository.find({
      where: { client: { id } },
      relations: ['projectLeader', 'receipt'],
      select: {
        projectLeader: {
          id: true,
          name: true,
          lastname: true,
          profilePicture: true,
          rating: true,
          role: true,
          votes: true,
          totalVotes: true,
        },
      },
    });

    if (!work) {
      throw new HttpException('Work not found', HttpStatus.NOT_FOUND);
    }

    return work;
  }

  async findWorksByProfessional(id: number): Promise<Work[]> {
    const work = await this.workRepository.find({
      where: { projectLeader: { id } },
      relations: ['projectLeader', 'receipt'],
      select: {
        projectLeader: {
          id: true,
          name: true,
          lastname: true,
          profilePicture: true,
          rating: true,
          role: true,
          votes: true,
          totalVotes: true,
        },
      },
    });

    if (!work) {
      throw new HttpException('Work not found', HttpStatus.NOT_FOUND);
    }

    return work;
  }

  async findWorks(): Promise<Work[]> {
    const works = await this.workRepository.find({
      relations: ['client', 'projectLeader'],
    });

    if (!works) {
      throw new HttpException('Any work founded', HttpStatus.NOT_FOUND);
    }

    return works;
  }

  async deleteWork(id: number) {
    const workFound = await this.workRepository.findOne({ where: { id } });

    if (!workFound) {
      return new HttpException('Work not found', HttpStatus.NOT_FOUND);
    }

    return this.workRepository.delete({ id: workFound.id });
  }

  async findReceiptByWork(id: number): Promise<Receipt> {
    const receipt = await this.receiptRepository.findOne({
      where: { work: { id } },
    });

    if (!receipt) {
      throw new HttpException('Receipt not found', HttpStatus.NOT_FOUND);
    }

    return receipt;
  }

  async findReceiptsByProfessional(id: number): Promise<Receipt[]> {
    const receipt = await this.receiptRepository.find({
      where: { work: { projectLeader: { id } } },
      relations: ['work.client'],
      select: {
        work: {
          id: true,
          status: true,
          client: { name: true, lastname: true },
        },
      },
    });

    if (!receipt) {
      throw new HttpException('Receipt not found', HttpStatus.NOT_FOUND);
    }

    return receipt;
  }

  async update(id: number, updateWorkDto: UpdateWorkDto): Promise<Work> {
    const work = await this.workRepository.findOne({ where: { id } });

    if (!work) {
      throw new HttpException('Work not found', HttpStatus.NOT_FOUND);
    }

    if (updateWorkDto.clientId) {
      const client = await this.userRepository.findOne({
        where: { id: updateWorkDto.clientId },
      });
      if (!client) {
        throw new HttpException('Client not found', HttpStatus.NOT_FOUND);
      }
      work.client = client;
    }

    if (updateWorkDto.projectLeaderId) {
      const projectLeader = await this.userRepository.findOne({
        where: { id: updateWorkDto.projectLeaderId },
      });
      if (!projectLeader) {
        throw new HttpException(
          'Project leader not found',
          HttpStatus.NOT_FOUND,
        );
      }
      work.projectLeader = projectLeader;
    }

    Object.assign(work, updateWorkDto);

    return this.workRepository.save(work);
  }
}
