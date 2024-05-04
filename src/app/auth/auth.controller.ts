import { AuthService } from './auth.service';
import { Controller, Body, Post, ValidationPipe } from '@nestjs/common';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ACCOUNT_SERVICE } from 'src/config';

@Controller(ACCOUNT_SERVICE)
@ApiTags('account')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('/signup')
  signUp(
    @Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto,
  ): Promise<void> {
    return this.authService.signUp(authCredentialsDto);
  }

  @ApiBody({
    type: AuthCredentialsDto,
  })
  @ApiConsumes('application/x-www-form-urlencoded')
  @Post('/signin')
  signIn(
    @Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.signIn(authCredentialsDto);
  }
}
