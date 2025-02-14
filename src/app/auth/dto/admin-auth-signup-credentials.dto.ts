import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AdminAuthSignUpCredentialsDto {
  @IsString()
  @MinLength(4)
  @MaxLength(100)
  @ApiProperty({ default: 'mao123', required: true })
  username: string;

  @ApiProperty({ default: 'mao123@gmail.com', required: true })
  @IsEmail()
  email: string;

  @ApiProperty({ default: 'mao123', required: true })
  @IsString()
  @MinLength(4)
  @MaxLength(100)
  fullName: string;

  @IsString()
  @MinLength(4)
  @MaxLength(100)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password to weak',
  })
  @ApiProperty({ default: 'Mao@123', required: true })
  password: string;
}
