import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(4)
  @MaxLength(100)
  @ApiProperty({ default: '*******', required: true })
  currentPassword: string;

  @IsString()
  @MinLength(4)
  @MaxLength(100)
  @ApiProperty({ default: '*******', required: true })
  newPassword: string;
}
