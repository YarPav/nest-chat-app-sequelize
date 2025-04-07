import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'admin', description: 'Роль' })
  value: string;
  @ApiProperty({ example: 'Администратор', description: 'Описание' })
  description: string;
}
