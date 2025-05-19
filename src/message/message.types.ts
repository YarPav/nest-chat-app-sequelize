import { Message } from './message.model';
import { ISentMessage } from '../events/chat/chat-events.interface';

export type MessageWithIsAuthor = ISentMessage & {
  isAuthor: boolean;
};
