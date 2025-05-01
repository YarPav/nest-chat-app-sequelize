import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/users.model';
import { Chat } from './chat.model';

export enum EParticipantRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  USER = 'user',
}

@Table({ tableName: 'participants', createdAt: false, updatedAt: false })
export class Participant extends Model<Participant> {
  @ApiProperty({ example: 1, description: 'Id' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Chat)
  @Column({ type: DataType.INTEGER })
  chatId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER })
  userId: number;

  @ApiProperty({ example: 'admin', description: 'Роль участника чата' })
  @Column({
    type: DataType.ENUM(...Object.values(EParticipantRole)),
    allowNull: false,
    defaultValue: EParticipantRole.USER,
  })
  role: EParticipantRole;
  // @BelongsTo(() => Role)
  // role: Role;
}
