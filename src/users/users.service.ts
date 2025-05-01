import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from './users.model';
import { InjectModel } from '@nestjs/sequelize';
import { CreateUserDto } from './dto/create-user.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { RequestWithUser } from '../app/types/app.types';
import { FindOptions, Op } from 'sequelize';
import { GetUserDto } from './dto/get-user.dto';
import { ClassConstructor, plainToInstance } from 'class-transformer';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private userRepository: typeof User) {}
  async createUser(dto: CreateUserDto): Promise<User> {
    return await this.userRepository.create(dto);
  }

  async findAll(options: FindOptions<User>): Promise<User[]> {
    return this.userRepository.findAll(options);
  }

  async getPotentialParticipants(chatId: number, req: RequestWithUser): Promise<GetUserDto[]> {
    // const

    const users = await this.userRepository.findAll({
      where: {
        id: {
          [Op.ne]: req.user.id,
        },
      },
      include: { all: true },
    });
    const plainUsers = users.map((user) => user.get({ plain: true }));

    return plainToInstance(GetUserDto, plainUsers, {
      excludeExtraneousValues: true,
    });
  }

  async getUserByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({
      where: { email },
      include: { all: true },
    });
  }

  // TODO Дописать перегрузки методов для работы с User и передаваемой DTO
  async getById(id: number): Promise<User>;
  async getById<T>(id: number, dto: ClassConstructor<T>): Promise<T>;
  async getById<T>(id: number, dto?: ClassConstructor<T>): Promise<User | T> {
    const user = await this.userRepository.findOne({
      where: { id },
      include: { all: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto) {
      const plainUser = user.get({ plain: true });
      return plainToInstance(dto, plainUser, {
        excludeExtraneousValues: true,
      });
    }

    return user;
  }

  // async addRole(addRoleDto: AddRoleDto) {
  //   const user = await this.userRepository.findByPk(addRoleDto.userId);
  //   const role = await this.roleService.getByValue(addRoleDto.value);
  //
  //   if (!user) {
  //     throw new NotFoundException(`User ${addRoleDto.userId} not found`);
  //   }
  //   if (!role) {
  //     throw new NotFoundException(`Role ${addRoleDto.value} not found`);
  //   }
  //
  //   await user.$add('role', role.id);
  //   return {
  //     response: `Role "${addRoleDto.value}" added to user "${addRoleDto.userId}"`,
  //   };
  // }

  async banUser(banUserDto: BanUserDto) {
    const user = await this.userRepository.findByPk(banUserDto.userId);

    if (!user) {
      throw new NotFoundException(`User ${banUserDto.userId} not found`);
    }

    user.banned = true;
    user.banReason = banUserDto.banReason;
    await user.save();

    return {
      response: `User "${banUserDto.userId}" has been banned`,
    };
  }
}
