import { AuthService } from './auth.service';
import { Controller, Body, Post, ValidationPipe } from '@nestjs/common';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ACCOUNT_SERVICE } from 'src/config';
import { UserRole } from './user-role.emum';
import { AdminAuthCredentialsDto } from './dto/admin-auth-credentials.dto copy';

@Controller(ACCOUNT_SERVICE)
@ApiTags('account')
export class AuthController {
  constructor(private authService: AuthService) {}
  @ApiOperation({ summary: 'Signup user' })
  @Post('/user/signup')
  signUp(
    @Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto,
  ): Promise<void> {
    return this.authService.signUp(authCredentialsDto, UserRole.USER);
  }

  @ApiOperation({ summary: 'Signin user' })
  @ApiBody({
    type: AuthCredentialsDto,
  })
  @ApiConsumes('application/x-www-form-urlencoded')
  @Post('/user/signin')
  signIn(
    @Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.signIn(authCredentialsDto);
  }

  @ApiOperation({ summary: 'Signup admin' })
  @Post('/signup')
  signUpAdmin(
    @Body(ValidationPipe) authCredentialsDto: AdminAuthCredentialsDto,
  ): Promise<void> {
    return this.authService.signUp(authCredentialsDto, UserRole.ADMIN);
  }

  @ApiOperation({ summary: 'Signin admin' })
  @ApiBody({
    type: AdminAuthCredentialsDto,
  })
  @ApiConsumes('application/x-www-form-urlencoded')
  @Post('/signin')
  signInAdmin(
    @Body(ValidationPipe) authCredentialsDto: AdminAuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.signIn(authCredentialsDto);
  }
}
