import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ChatService } from './chat.service';

const CHAT_ID_REQEXP = new RegExp('\/chat\/(\\d+)');

@Injectable()
export class IsChatParticipantGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = this.authService.getUserFromRequest(req);
    const chatId = CHAT_ID_REQEXP.test(req.url)
      ? Number(req.url.match(CHAT_ID_REQEXP)[1])
      : req.body.chatId;

    if (!user || !chatId) {
      return false;
    }
    return this.chatService.isChatParticipant(user.id, chatId);
  }
}
