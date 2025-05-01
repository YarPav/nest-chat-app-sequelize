import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Chat } from './chat.model';
import { Participant } from './participant.model';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ChatsGateway } from './chats.gateway';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    SequelizeModule.forFeature([Chat, Participant]),
    UsersModule,
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatsGateway, ChatGateway],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
