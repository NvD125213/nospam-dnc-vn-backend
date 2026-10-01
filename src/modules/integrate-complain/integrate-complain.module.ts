import { Module } from '@nestjs/common';
import { DncModule } from '../../integrations/dnc';
import { IntegrateComplainController } from './integrate-complain.controller';
import { IntegrateComplainService } from './integrate-complain.service';
import { CaptchaModule } from '../captcha/captcha.module';

@Module({
  imports: [DncModule, CaptchaModule],
  controllers: [IntegrateComplainController],
  providers: [IntegrateComplainService],
})
export class IntegrateComplainModule {}
