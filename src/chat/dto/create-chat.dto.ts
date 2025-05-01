import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateChatDto {
  @IsString()
  @Length(1, 50, {
    message: 'Chat title must be more than 1 but less than 50 characters',
  })
  title: string;
}
