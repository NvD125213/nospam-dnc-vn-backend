import { Module } from '@nestjs/common';
import { DncModule } from '../../integrations/dnc';
import { IntegrateReflectController } from './integrate-reflect.controller';
import { IntegrateReflectService } from './integrate-reflect.service';
import { CaptchaModule } from '../captcha/captcha.module';

@Module({
  imports: [DncModule, CaptchaModule],
  controllers: [IntegrateReflectController],
  providers: [IntegrateReflectService],
})
export class IntegrateReflectModule {}
