export interface IChatUserRemoved {
  chatId: number;
  userId: number;
}

export interface IChatUserInvited {
  chatId: number;
  userId: number;
  title: string;
  userEmail?: string;
}

export interface ISentMessage {
  messageId: number;
  chatId: number;
  authorId: number;
  authorEmail: string;
  text: string;
}
