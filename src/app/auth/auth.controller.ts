import { AuthService } from './auth.service';
import { Controller, Body, Post, ValidationPipe } from '@nestjs/common';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ACCOUNT_SERVICE } from 'src/config';
import { UserRole } from './user-role.emum';
import { AdminAuthCredentialsDto } from './dto/admin-auth-credentials.dto copy';

@Controller(ACCOUNT_SERVICE)
@ApiTags('account')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('/signup')
  signUp(
    @Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto,
  ): Promise<void> {
    return this.authService.signUp(authCredentialsDto, UserRole.USER);
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

  @Post('/signup/admin')
  signUpAdmin(
    @Body(ValidationPipe) authCredentialsDto: AdminAuthCredentialsDto,
  ): Promise<void> {
    return this.authService.signUp(authCredentialsDto, UserRole.ADMIN);
  }

  @ApiBody({
    type: AdminAuthCredentialsDto,
  })
  @ApiConsumes('application/x-www-form-urlencoded')
  @Post('/signin/admin')
  signInAdmin(
    @Body(ValidationPipe) authCredentialsDto: AdminAuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.signIn(authCredentialsDto);
  }
}
