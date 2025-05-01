import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/users.model';
import { Message } from '../message/message.model';
import { ChatService } from './chat.service';
import { OnEvent } from '@nestjs/event-emitter';
import { EChatEvents } from '../events/chat/chat-events.enum';
import {
  IChatUserInvited,
  IChatUserRemoved, ISentMessage,
} from '../events/chat/chat-events.interface';
import { UsersService } from '../users/users.service';
import { GetUserDto } from '../users/dto/get-user.dto';

interface IReceiver {
  userId: number;
  sockets: string[];
}

@WebSocketGateway({ namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection {
  constructor(
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
    private readonly usersService: UsersService,
  ) {}

  private chatSocketsMap = new Map<number, IReceiver[]>();

  @WebSocketServer()
  server: Server = new Server();

  async handleConnection(socket: any): Promise<any> {
    try {
      const authHeader: string = socket.handshake.headers['authorization'];
      const chatId: number = Number(socket.handshake.query.chatId);

      if (!chatId) {
        socket.disconnect(true);
      }

      const user: User =
        await this.authService.getUserFromAuthHeader(authHeader);

      if (!user) {
        socket.disconnect(true);
      }

      const isChatParticipant = await this.chatService.isChatParticipant(
        user.id,
        chatId,
      );

      if (!isChatParticipant) {
        socket.disconnect(true);
      }

      const chatSockets = this.chatSocketsMap.get(chatId) ?? [];

      const userSockets = chatSockets.find(
        (chatUser) => chatUser.userId === user.id,
      );

      if (userSockets) {
        if (!userSockets.sockets.includes(socket.id)) {
          userSockets.sockets.push(socket.id);
        }
      } else {
        chatSockets.push({
          userId: user.id,
          sockets: [socket.id],
        });
      }

      this.chatSocketsMap.set(chatId, chatSockets);
    } catch (e) {
      socket.disconnect(true);
    }
  }

  // @SubscribeMessage('sendMessage')
  @OnEvent(EChatEvents.MessageSent)
  async sendMessage(createdMessage: ISentMessage) {
    const receivers: IReceiver[] = this.getReceiversSafe(createdMessage.chatId);

    const receiverSocketIds: string[] = receivers.flatMap(
      (receiver) => receiver.sockets,
    );

    if (receiverSocketIds.length) {
      this.server
        .to(receiverSocketIds)
        .emit(`recMessageFromChat/${createdMessage.chatId}`, createdMessage);
    }
  }

  @OnEvent(EChatEvents.UserInvited)
  async inviteUserToChat(payload: IChatUserInvited): Promise<void> {
    const receiversSocketIds: string[] = this.getReceiversSafe(payload.chatId)
      .filter((receiver) => receiver.userId !== payload.userId)
      .flatMap((receiver) => receiver.sockets);

    if (receiversSocketIds.length) {
      const invitedUser: GetUserDto = await this.usersService.getById(
        payload.userId,
        GetUserDto,
      );
      payload.userEmail = invitedUser.email;
      this.server.to(receiversSocketIds).emit('recInviteUserToChat', payload);
    }
  }

  @OnEvent(EChatEvents.UserRemoved)
  async removeUserFromChat(payload: IChatUserRemoved): Promise<void> {
    const receivers: IReceiver[] = this.getReceiversSafe(payload.chatId);
    let userToRemoveSocketIds: string[] = [];
    const otherUsersSocketIds: string[] = [];

    for (const receiver of receivers) {
      if (receiver.userId === payload.userId) {
        userToRemoveSocketIds = receiver.sockets;
      } else {
        otherUsersSocketIds.push(...receiver.sockets);
      }
    }

    if (userToRemoveSocketIds.length) {
      this.server
        .to(userToRemoveSocketIds)
        .emit(`recRemoveMeFromChat/${payload.chatId}`);
    }

    if (otherUsersSocketIds.length) {
      this.server
        .to(otherUsersSocketIds)
        .emit(`recRemoveUserFromChat/${payload.chatId}`, payload);
    }
  }

  handleDisconnect(socket: Socket) {
    for (const [chatId, receivers] of this.chatSocketsMap.entries()) {
      const updatedReceivers = receivers
        .map((receiver) => ({
          ...receiver,
          sockets: receiver.sockets.filter((sid) => sid !== socket.id),
        }))
        .filter((receiver) => receiver.sockets.length > 0); // убираем пользователей без сокетов

      if (updatedReceivers.length > 0) {
        this.chatSocketsMap.set(chatId, updatedReceivers);
      } else {
        this.chatSocketsMap.delete(chatId); // если вообще никого нет — удаляем чат
      }
    }
  }

  private getReceiversSafe(chatId: number): IReceiver[] {
    return this.chatSocketsMap.get(chatId) ?? [];
  }
}
