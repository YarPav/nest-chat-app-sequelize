import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GetUserDto {
  @Expose()
  @ApiProperty({ example: 1, description: 'Id' })
  id: number;

  @Expose()
  @ApiProperty({ example: 'user@email.com', description: 'Email пользователя' })
  readonly email: string;

  @Expose()
  @ApiProperty({ example: true, description: 'Заблокирован ли пользователь' })
  readonly banned: boolean;

  @Expose()
  @ApiProperty({
    example: 'Оскорбление',
    description: 'Причина блокировки пользователя',
  })
  readonly banReason: string;
}
