import { AuthService } from './auth.service';
import {
  Controller,
  Body,
  Post,
  ValidationPipe,
  Get,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ACCOUNT_SERVICE } from 'src/config';
import { AdminAuthCredentialsDto } from './dto/admin-auth-credentials.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from './user';

@Controller(ACCOUNT_SERVICE)
@ApiTags('account')
export class AuthController {
  constructor(private authService: AuthService) {}
  // ADMIN LOGIN
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

  // USER LOGIN

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

  // 3RD LOGIN

  @Get('signin/facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookLogin(): Promise<any> {
    return HttpStatus.OK;
  }

  @Get('facebook/redirect')
  @UseGuards(AuthGuard('facebook'))
  async facebookLoginCallback(
    @Req() req: Record<string, any>,
  ): Promise<{ accessToken: string }> {
    const userData = req?.user?.user;
    console.log('data_facebook', userData);
    return this.authService.signIn3rd(userData);
  }

  @Get('signin/google')
  @UseGuards(AuthGuard('google'))
  async googleLogin(): Promise<any> {
    return HttpStatus.OK;
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(
    @Req() req: Record<string, any>,
  ): Promise<{ accessToken: string }> {
    const userData = req?.user?.user;
    console.log('data_google', userData);
    return this.authService.signIn3rd(userData);
  }
}
