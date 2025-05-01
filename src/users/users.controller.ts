import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from './users.model';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BanUserDto } from './dto/ban-user.dto';
import { ValidationPipe } from '../pipes/validation.pipe';
import { RequestWithUser } from '../app/types/app.types';

@ApiTags('Пользователи')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Создание пользователя' })
  @ApiResponse({ status: 200, type: User })
  @UsePipes(new ValidationPipe())
  @Post()
  create(@Body() userDto: CreateUserDto) {
    return this.usersService.createUser(userDto);
  }

  @ApiOperation({ summary: 'Получение всех пользователей' })
  @ApiResponse({ status: 200, type: [User] })
  // @Roles('user')
  @Get()
  getAll() {
    return this.usersService.findAll({ include: { all: true } });
  }

  @ApiOperation({
    summary: 'Получение всех пользователей, которых возможно добавить в чат',
  })
  @ApiResponse({ status: 200, type: [User] })
  // @Roles('user')
  @Get(':chatId/potential-participants')
  async getPotentialParticipants(
    @Param('chatId') chatId: number,
    @Req() req: RequestWithUser,
  ) {
    const res = await this.usersService.getPotentialParticipants(chatId, req);
    return res;
  }

  // // @Roles('user')
  @Get('/me')
  getMe(@Req() req: RequestWithUser) {
    return this.usersService.getById(req.user.id);
  }

  @ApiOperation({ summary: 'Выдача роли пользователю' })
  @ApiResponse({ status: 200 })
  // @Roles('admin')
  // @Post('/add-role')
  // addRole(@Body() addRoleDto: AddRoleDto) {
  //   return this.usersService.addRole(addRoleDto);
  // }

  @ApiOperation({ summary: 'Выдача роли пользователю' })
  @ApiResponse({ status: 200 })
  // @Roles('admin')
  @Post('/ban')
  banUser(@Body() banUserDto: BanUserDto) {
    return this.usersService.banUser(banUserDto);
  }
}
