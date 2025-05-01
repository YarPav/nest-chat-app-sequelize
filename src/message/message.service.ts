import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message, MessageAttributes } from './message.model';
import { InjectModel } from '@nestjs/sequelize';
import { RequestWithUser } from '../app/types/app.types';
import { User } from '../users/users.model';
import { MessageWithIsAuthor } from './message.types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EChatEvents } from '../events/chat/chat-events.enum';
import { ISentMessage } from '../events/chat/chat-events.interface';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message) private readonly messageRepository: typeof Message,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    req: RequestWithUser,
  ): Promise<MessageWithIsAuthor> {
    const author = req.user;

    // Сохраняем сообщение
    const message = await this.messageRepository.create({
      authorId: author.id,
      ...createMessageDto,
    });

    // Загружаем его с нужными полями и связями
    const createdMessage = await this.messageRepository.findOne({
      where: { id: message.id },
      attributes: ['id', 'chatId', 'text', 'authorId'],
      include: [
        {
          model: User,
          attributes: ['id', 'email'],
        },
      ],
    });

    const sentMessage: ISentMessage = {
      messageId: createdMessage.id,
      chatId: createdMessage.chatId,
      authorId: createdMessage.author.id,
      authorEmail: createdMessage.author.email,
      text: createdMessage.text,
    };

    // await this.chatGateway.create(createdMessage);
    this.eventEmitter.emit(EChatEvents.MessageSent, sentMessage);
    // Возвращаем plain-объект с флагом isAuthor
    // const plain = createdMessage.get({ plain: true }) as MessageAttributes;

    return {
      ...sentMessage,
      isAuthor: true, // текущий пользователь — автор
    };
  }

  async getAll(
    chatId: number,
    req: RequestWithUser,
  ): Promise<MessageWithIsAuthor[]> {
    const messages = await this.messageRepository.findAll({
      where: { chatId },
      order: [['updatedAt', 'ASC']],
      attributes: ['id', 'chatId', 'text'],
      include: [
        {
          model: User,
          attributes: ['id', 'email'],
        },
      ],
    });

    return messages.map((message) => {
      // const plain = message.get({ plain: true }) as MessageAttributes;

      const sentMessage: ISentMessage = {
        messageId: message.id,
        chatId: message.chatId,
        authorId: message.author.id,
        authorEmail: message.author.email,
        text: message.text,
      };

      return {
        ...sentMessage,
        isAuthor: sentMessage.authorId === req.user.id,
      };
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} message`;
  }

  remove(id: number) {
    return `This action removes a #${id} message`;
  }
}
