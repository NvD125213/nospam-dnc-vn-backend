import { Module } from '@nestjs/common';
import { DncModule } from '../../integrations/dnc';
import { IntegrateInventoryController } from './integrate-inventory.controller';
import { IntegrateInventoryService } from './integrate-inventory.service';
import { CaptchaModule } from '../captcha/captcha.module';

@Module({
  imports: [DncModule, CaptchaModule],
  controllers: [IntegrateInventoryController],
  providers: [IntegrateInventoryService],
})
export class IntegrateInventoryModule {}
