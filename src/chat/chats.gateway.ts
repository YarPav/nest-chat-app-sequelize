import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/users.model';
import { OnEvent } from '@nestjs/event-emitter';
import { EChatEvents } from '../events/chat/chat-events.enum';
import {
  IChatUserInvited,
  IChatUserRemoved,
} from '../events/chat/chat-events.interface';

@WebSocketGateway({ namespace: 'chats' })
export class ChatsGateway implements OnGatewayConnection {
  constructor(private readonly authService: AuthService) {}

  private userSocketsMap = new Map<number, string[]>();

  @WebSocketServer()
  server: Server = new Server();

  async handleConnection(socket: any): Promise<any> {
    try {
      const authHeader: string = socket.handshake.headers['authorization'];

      const user: User =
        await this.authService.getUserFromAuthHeader(authHeader);

      if (!user) {
        socket.disconnect(true);
      }

      const userSocketMap = this.userSocketsMap.get(user.id);

      if (!userSocketMap) {
        this.userSocketsMap.set(user.id, [socket.id]);
      } else {
        this.userSocketsMap.set(user.id, [...userSocketMap, socket.id]);
      }
    } catch (e) {
      socket.disconnect(true);
    }
  }

  @OnEvent(EChatEvents.UserInvited)
  async inviteUserToChat(payload: IChatUserInvited): Promise<void> {
    const receiverSocketIds: string[] = this.getReceiversSafe(payload.userId);

    if (receiverSocketIds.length) {
      this.server.to(receiverSocketIds).emit('recInviteUserToChat', payload);
    }
  }

  @OnEvent(EChatEvents.UserRemoved)
  async removeUserFromChat(payload: IChatUserRemoved): Promise<void> {
    const receiverSocketIds: string[] = this.getReceiversSafe(payload.userId);

    if (receiverSocketIds.length) {
      this.server.to(receiverSocketIds).emit('recRemoveUserFromChat', payload);
    }
  }

  private getReceiversSafe(userId: number): string[] {
    return this.userSocketsMap.get(userId) ?? [];
  }
}
