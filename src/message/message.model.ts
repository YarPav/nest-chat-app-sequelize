import {
  BelongsTo,
  Column,
  DataType, ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/users.model';
import { Chat } from '../chat/chat.model';

interface MessagesCreationAttrs {
  text: string;
}

@Table({ tableName: 'messages' })
export class Message extends Model<Message, MessagesCreationAttrs> {
  @ApiProperty({ example: 1, description: 'Id' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({ example: 'Message', description: 'Message text' })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  text: string;

  @ForeignKey(() => Chat)
  @Column({ type: DataType.INTEGER })
  chatId: number;

  @ApiProperty({ description: 'Chat message belongs to' })
  @BelongsTo(() => Chat)
  chat: Chat;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER })
  authorIdNew: number;

  @ApiProperty({ example: 'Alex', description: 'Message author' })
  @BelongsTo(() => User)
  author: User;
}
