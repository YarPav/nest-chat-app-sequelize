import { forwardRef, Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { AuthModule } from '../auth/auth.module';
import { MessageController } from './message.controller';
import { ChatModule } from '../chat/chat.module';
import { Message } from './message.model';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => ChatModule),
    SequelizeModule.forFeature([Message]),
  ],
  providers: [MessageService],
  controllers: [MessageController],
})
export class MessageModule {}
