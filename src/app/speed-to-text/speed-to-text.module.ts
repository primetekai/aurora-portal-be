import { Module } from '@nestjs/common';
import { AuthModule } from 'src/app/auth/auth.module';
import { SpeedToTextController } from './speed-to-text.controller';
import { SpeedToTextService } from './speed-to-text.service';

@Module({
  imports: [AuthModule],
  controllers: [SpeedToTextController],
  providers: [SpeedToTextService],
})
export class SpeedToTextModule {}
