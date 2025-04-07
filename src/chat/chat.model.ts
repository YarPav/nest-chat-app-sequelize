import {
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/users.model';
import { Participant } from './participant.model';
import { Message } from '../message/message.model';

@Table({ tableName: 'chats' })
export class Chat extends Model<Chat> {
  @ApiProperty({ example: 1, description: 'Id' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @BelongsToMany(() => User, () => Participant)
  participants: Participant[];

  @HasMany(() => Message)
  messages: Message[];
}
