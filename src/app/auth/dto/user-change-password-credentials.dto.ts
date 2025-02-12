import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  @ApiProperty({ default: '*******', required: true })
  currentPassword: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  @ApiProperty({ default: '*******', required: true })
  newPassword: string;
}
