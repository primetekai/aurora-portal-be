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
  Res,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ACCOUNT_SERVICE } from 'src/config';
import { AuthGuard } from '@nestjs/passport';
import {
  AdminAuthSignInCredentialsDto,
  AdminAuthSignUpCredentialsDto,
  AuthUserSignInCredentialsDto,
  AuthUserSignUpCredentialsDto,
} from './dto';
import { UserRole } from './enum';
import { GetUser, User } from '../user';
import { RolesGuard, Roles } from './role';
import { AuthUserSignIn3rdCredentialsDto } from './dto/auth-user-signin-3rd-credentials.dto';

@Controller(ACCOUNT_SERVICE)
@ApiTags('account')
export class AuthController {
  constructor(private authService: AuthService) {}
  // ADMIN LOGIN
  @ApiOperation({ summary: 'Signup admin' })
  @Post('/signup')
  signUpAdmin(
    @Body(ValidationPipe) authCredentialsDto: AdminAuthSignUpCredentialsDto,
  ): Promise<void> {
    return this.authService.signUp(authCredentialsDto, UserRole.ADMIN);
  }

  @ApiOperation({ summary: 'Signin admin' })
  @ApiBody({
    type: AdminAuthSignInCredentialsDto,
  })
  @ApiConsumes('application/x-www-form-urlencoded')
  @Post('/signin')
  signInAdmin(
    @Body(ValidationPipe) authCredentialsDto: AdminAuthSignInCredentialsDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.signIn(authCredentialsDto);
  }

  // USER LOGIN
  @ApiOperation({ summary: 'Signup user' })
  @Post('/user/signup')
  signUp(
    @Body(ValidationPipe) authCredentialsDto: AuthUserSignUpCredentialsDto,
  ): Promise<void> {
    return this.authService.signUp(authCredentialsDto, UserRole.USER);
  }

  @ApiOperation({ summary: 'Signin user' })
  @ApiBody({
    type: AuthUserSignInCredentialsDto,
  })
  @ApiConsumes('application/x-www-form-urlencoded')
  @Post('/user/signin')
  signIn(
    @Body(ValidationPipe) authCredentialsDto: AuthUserSignInCredentialsDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.signIn(authCredentialsDto);
  }

  // 3RD LOGIN
  @ApiOperation({ summary: 'Signin 3rd user' })
  @ApiBody({
    type: AuthUserSignIn3rdCredentialsDto,
  })
  @ApiConsumes('application/x-www-form-urlencoded')
  @Post('/user/signin-3rd')
  signIn3rd(
    @Body(ValidationPipe)
    auth3rdCredentialsDto: AuthUserSignIn3rdCredentialsDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.signIn3rd(auth3rdCredentialsDto);
  }

  // @Get('signin/facebook')
  // @UseGuards(AuthGuard('facebook'))
  // async facebookLogin(): Promise<any> {
  //   return HttpStatus.OK;
  // }

  // @Get('facebook/redirect')
  // @UseGuards(AuthGuard('facebook'))
  // async facebookLoginCallback(
  //   @Req() req: Record<string, any>,
  // ): Promise<{ accessToken: string }> {
  //   const userData = req?.user?.user;
  //   return this.authService.signInAdnSignUp3rd(userData);
  // }

  // @Get('signin/google')
  // @UseGuards(AuthGuard('google'))
  // async googleLogin(): Promise<any> {
  //   return HttpStatus.OK;
  // }

  // @Get('google/redirect')
  // @UseGuards(AuthGuard('google'))
  // async googleLoginCallback(
  //   @Req() req: Record<string, any>,
  // ): Promise<{ accessToken: string }> {
  //   const userData = req?.user?.user;
  //   return this.authService.signInAdnSignUp3rd(userData);
  // }

  @ApiBearerAuth()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all accounts' })
  @ApiResponse({ status: 200, description: 'Return all accounts.' })
  @Get('/accounts')
  async getAccounts(@Res() res, @GetUser() user: User) {
    try {
      const data = await this.authService.getAccounts(user);
      return res.status(HttpStatus.OK).json(data);
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(e);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, description: 'Get user by id' })
  @Get('/accounts/:id')
  async getAccountById(
    @Param('id') id: string,
    @GetUser() user: User,
    @Res() res,
  ) {
    try {
      const data = await this.authService.getAccountById(id, UserRole.USER);
      return res.status(HttpStatus.OK).json(data);
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(e);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Get user info' })
  @ApiResponse({ status: 200, description: 'Get user info' })
  @Get('/accounts/me/user-info')
  async getProfile(@GetUser() user: User, @Res() res) {
    try {
      const data = await this.authService.getAccountById(
        `${user.id}`,
        UserRole.USER,
      );
      return res.status(HttpStatus.OK).json({
        username: data?.username,
        email: data?.email,
        fullName: data?.fullName,
        avatar: data?.avatar,
      });
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(e);
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get admin info' })
  @ApiResponse({ status: 200, description: 'Get admin info' })
  @Get('/accounts/me/admin-info')
  async getAdminProfile(@GetUser() user: User, @Res() res) {
    try {
      const data = await this.authService.getAccountById(
        `${user.id}`,
        UserRole.ADMIN,
      );
      return res.status(HttpStatus.OK).json({
        username: data?.username,
        email: data?.email,
        fullName: data?.fullName,
        avatar: data?.avatar,
      });
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(e);
    }
  }
}
