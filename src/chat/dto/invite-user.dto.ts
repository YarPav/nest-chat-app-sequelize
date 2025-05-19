import { IsNumber } from 'class-validator';

export class InviteUserDto {
  @IsNumber()
  chatId: number;

  @IsNumber()
  userId: number;
}
