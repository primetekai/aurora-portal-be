import { AuthService } from './auth.service';
import {
  Controller,
  Body,
  Post,
  ValidationPipe,
  Get,
  UseGuards,
  HttpStatus,
  Res,
  Param,
  Patch,
  Logger,
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
  ChangePasswordDto,
} from './dto';
import { UserRole } from './enum';
import { GetUser, User } from '../user';
import { RolesGuard, Roles } from './role';

@Controller(ACCOUNT_SERVICE)
@ApiTags('account')
export class AuthController {
  constructor(private authService: AuthService) {}

  private logger = new Logger('User auth');

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

  @Post('/signup/json')
  async signUpBatch(
    @Body(ValidationPipe) authCredentialsArray: AuthUserSignUpCredentialsDto[],
  ): Promise<any> {
    if (
      !Array.isArray(authCredentialsArray) ||
      authCredentialsArray.length === 0
    ) {
      throw new Error('Invalid input data. Expected a JSON array.');
    }

    this.logger.log(
      `📢 Received ${authCredentialsArray.length} users for registration...`,
    );

    const results = [];

    for (const authCredentialsDto of authCredentialsArray) {
      try {
        await this.authService.signUp(authCredentialsDto, UserRole.USER);
        results.push({ email: authCredentialsDto.email, status: '✅ Success' });

        this.logger.log(
          `✅ Registration successful: ${authCredentialsDto.email}`,
        );

        // Wait 1 second between each request to prevent server overload
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.error(
          `❌ Registration failed for ${authCredentialsDto.email}:`,
          error.message,
        );
        results.push({
          email: authCredentialsDto.email,
          status: '❌ Failed',
          error: error.message,
        });
      }
    }

    return { message: 'Batch registration completed', results };
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Change password' })
  @Patch('/change-password')
  async changePassword(
    @GetUser() user: User,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user, changePasswordDto);
  }
}
