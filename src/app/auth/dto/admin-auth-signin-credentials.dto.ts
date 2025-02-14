import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AdminAuthSignInCredentialsDto {
  @IsString()
  @MinLength(4)
  @MaxLength(100)
  @ApiProperty({ default: 'mao123', required: true })
  username: string;

  @IsString()
  @MinLength(4)
  @MaxLength(100)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password to weak',
  })
  @ApiProperty({ default: 'Mao@123', required: true })
  password: string;
}
