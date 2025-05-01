import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UsePipes,
  UseGuards,
  Render,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { ValidationPipe } from '../pipes/validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/users.model';
import { IsChatParticipantGuard } from './is-chat-participant.guard';
import { RequestWithUser } from '../app/types/app.types';
import { InviteUserDto } from './dto/invite-user.dto';
import { ApiResponse } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    // private readonly userService: UsersService,
  ) {}

  @UsePipes(new ValidationPipe())
  @Post('new')
  create(@Body() createChatDto: CreateChatDto, @Req() req: RequestWithUser) {
    return this.chatService.create(createChatDto, req);
  }

  @Get('all')
  @Render('chats')
  async findAll(@Req() req: RequestWithUser) {
    return {
      chats: await this.chatService.findAll(req),
    };
  }

  @UseGuards(IsChatParticipantGuard)
  @Get(':id')
  @Render('chat')
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return await this.chatService.findOne(+id, req);
  }

  //TODO Этот роут нужен только для демонстрационной версии (handlebars),
  // на реальном проекте с отдельным frontend`ом он не потребуется
  @UseGuards(IsChatParticipantGuard)
  @Get(':id/info')
  async findOneInfo(@Param('id') id: string, @Req() req: RequestWithUser) {
    return await this.chatService.findOne(+id, req);
  }

  @ApiResponse({ status: 200, type: [User] })
  @Get(':chatId/potential-participants')
  async getPotentialParticipants(@Param('chatId') chatId: number) {
    return await this.chatService.getPotentialParticipants(chatId);
  }

  @Post('invite')
  async inviteUser(@Body() dto: InviteUserDto) {
    return await this.chatService.inviteUser(dto);
  }

  @Post('remove')
  async removeUser(@Body() dto: InviteUserDto) {
    return await this.chatService.removeUser(dto);
  }
}
