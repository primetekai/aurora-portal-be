import { Controller, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';

@Controller('user')
@ApiTags('user')
export class UserController {
  private logger = new Logger('UserController');

  constructor(private userService: UserService) {}
}
