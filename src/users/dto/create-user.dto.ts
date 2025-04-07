import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@email.com', description: 'Email пользователя' })
  @IsString({ message: 'Must be a string' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  readonly email: string;

  @ApiProperty({ example: 'pa$$word', description: 'Пароль пользователя' })
  @IsString({ message: 'Must be a string' })
  @Length(3, 16, {
    message: 'Password must be more than 3 but less than 16 characters',
  })
  readonly password: string;
}
