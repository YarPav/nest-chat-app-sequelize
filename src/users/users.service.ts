import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { User } from './users.model';
import { InjectModel } from '@nestjs/sequelize';
import { CreateUserDto } from './dto/create-user.dto';
import { RolesService } from '../roles/roles.service';
import { AddRoleDto } from './dto/add-role.dto';
import { BanUserDto } from './dto/ban-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private userRepository: typeof User,
    private roleService: RolesService,
  ) {}
  async createUser(dto: CreateUserDto): Promise<User> {
    const user = await this.userRepository.create(dto);
    const role = await this.roleService.getRoleByValue('user');
    await user.$set('roles', [role.id]);
    user.roles = [role];
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll({ include: { all: true } });
  }

  async getUserByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({
      where: { email },
      include: { all: true },
    });
  }

  async addRole(addRoleDto: AddRoleDto) {
    const user = await this.userRepository.findByPk(addRoleDto.userId);
    const role = await this.roleService.getRoleByValue(addRoleDto.value);

    if (!user) {
      throw new NotFoundException(`User ${addRoleDto.userId} not found`);
    }
    if (!role) {
      throw new NotFoundException(`Role ${addRoleDto.value} not found`);
    }

    await user.$add('role', role.id);
    return {
      response: `Role "${addRoleDto.value}" added to user "${addRoleDto.userId}"`,
    };
  }

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
