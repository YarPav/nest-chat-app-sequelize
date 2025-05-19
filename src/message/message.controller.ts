import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsChatParticipantGuard } from '../chat/is-chat-participant.guard';
import { RequestWithUser } from '../app/types/app.types';

@UseGuards(JwtAuthGuard)
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @UseGuards(IsChatParticipantGuard)
  @Post('/new')
  createMessage(
    @Body() createChatDto: CreateMessageDto,
    @Req() req: RequestWithUser,
  ) {
    return this.messageService.create(createChatDto, req);
  }

  @UseGuards(IsChatParticipantGuard)
  @Post('/all')
  getAll(@Body() body: { chatId: number }, @Req() req: RequestWithUser) {
    const { chatId } = body;
    return this.messageService.getAll(chatId, req);
  }
}
