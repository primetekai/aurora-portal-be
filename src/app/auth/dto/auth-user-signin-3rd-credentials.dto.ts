import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class AuthUserSignIn3rdCredentialsDto {
  @IsString()
  @ApiProperty({ default: '', required: true })
  token: string;

  @IsString()
  @ApiProperty({ default: '', required: true })
  @IsIn(['google', 'facebook'], {
    message: 'typeLogin must be "google" or "facebook"',
  })
  typeLogin: string;
}
