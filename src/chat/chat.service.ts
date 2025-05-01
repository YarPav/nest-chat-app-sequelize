import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { Chat } from './chat.model';
import { InjectModel } from '@nestjs/sequelize';
import { EParticipantRole, Participant } from './participant.model';
import { User } from '../users/users.model';
import { Op } from 'sequelize';
import { RequestWithUser } from '../app/types/app.types';
import { InviteUserDto } from './dto/invite-user.dto';
import { GetUserDto } from '../users/dto/get-user.dto';
import { plainToInstance } from 'class-transformer';
import { UsersService } from '../users/users.service';
import { ChatsGateway } from './chats.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EChatEvents } from '../events/chat/chat-events.enum';
import {
  IChatUserInvited,
  IChatUserRemoved,
} from '../events/chat/chat-events.interface';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat)
    private readonly chatRepository: typeof Chat,
    @InjectModel(Participant)
    private readonly participantRepository: typeof Participant,
    private readonly usersService: UsersService,
    private readonly chatsGateway: ChatsGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createChatDto: CreateChatDto, req: RequestWithUser) {
    const user = req.user;
    const chat = await this.chatRepository.create(createChatDto);
    await chat.$add('participants', user.id, {
      through: { role: EParticipantRole.OWNER },
    });

    return chat;
  }

  async findAll(req: RequestWithUser) {
    const user = req.user;

    const chats = await this.chatRepository.findAll({
      attributes: ['id', 'title'],
      // where: { $participants$: { [Op.contains]: [user] } },
      // include: [{ model: Participant, attributes: ['email'] }],
      include: [
        {
          model: User,
          attributes: ['id', 'email'],
          through: { attributes: [] },
          where: { id: [user.id] },
        },
      ],
    });

    return chats;
  }

  async findOne(
    id: number,
    req: RequestWithUser,
  ): Promise<{ data: Chat; isOwner: boolean; myId: number }> {
    const chat = await this.chatRepository.findOne({
      where: { id },
      include: { all: true },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const chatOwner = await this.participantRepository.findOne({
      // include: [{ model: Role, where: { value: 'OWNER' } }],
      where: { chatId: chat.id, role: EParticipantRole.OWNER },
    });

    if (!chatOwner) {
      throw new InternalServerErrorException('Chat owner not found');
    }

    const requestingParticipant = await this.participantRepository.findOne({
      where: { userId: req.user.id },
      include: { all: true },
    });

    if (!requestingParticipant) {
      throw new ForbiddenException('You are not participant of this chat');
    }

    const isOwner = chatOwner.userId === req.user.id;

    return {
      data: chat,
      isOwner,
      myId: req.user.id,
    };
  }

  async getChatParticipants(chatId: number): Promise<Participant[]> {
    return this.participantRepository.findAll({ where: { chatId } });
  }

  async isChatParticipant(userId: number, chatId: number): Promise<boolean> {
    const chatParticipant = await this.participantRepository.findOne({
      where: {
        chatId,
        userId,
      },
    });

    return Boolean(chatParticipant);
  }

  async getPotentialParticipants(
    chatId: number,
    // req: RequestWithUser,
  ): Promise<GetUserDto[]> {
    const participants = await this.participantRepository.findAll({
      where: { chatId },
      attributes: ['userId'],
    });

    const participantIds = participants.map(
      (participant) => participant.userId,
    );

    const users = await this.usersService.findAll({
      where: {
        id: {
          [Op.notIn]: participantIds,
        },
      },
      include: { all: true },
    });

    // return users;
    const plainUsers = users.map((user) => user.get({ plain: true }));

    return plainToInstance(GetUserDto, plainUsers, {
      excludeExtraneousValues: true,
    });
  }

  async inviteUser(dto: InviteUserDto): Promise<GetUserDto> {
    if (dto.userId === -1) {
      throw new NotFoundException('User not found');
    }

    const success = Boolean(await this.participantRepository.create(dto));

    if (!success) {
      throw new InternalServerErrorException('Error while invite user');
    }

    const chat = await this.chatRepository.findOne({
      where: { id: dto.chatId },
      attributes: ['title'],
    });

    const userInvited: IChatUserInvited = {
      userId: dto.userId,
      chatId: dto.chatId,
      title: chat.title,
    };

    this.eventEmitter.emit(EChatEvents.UserInvited, userInvited);
    return await this.usersService.getById(dto.userId, GetUserDto);
  }

  async removeUser(dto: InviteUserDto): Promise<GetUserDto> {
    const { chatId, userId } = dto;

    // const success = Boolean(
    //   await this.participantRepository.destroy({
    //     where: { chatId, userId },
    //   }),
    // );

    const success = await this.participantRepository.destroy({
      where: { chatId, userId },
    });

    if (!success) {
      throw new InternalServerErrorException(
        'Error while removing participant',
      );
    }

    const removedUser: IChatUserRemoved = {
      chatId: dto.chatId,
      userId: dto.userId,
    };

    this.eventEmitter.emit(EChatEvents.UserRemoved, removedUser);
    return await this.usersService.getById(dto.userId, GetUserDto);
  }
}
