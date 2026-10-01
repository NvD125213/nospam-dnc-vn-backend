import { Module } from '@nestjs/common';
import { DncModule } from '../../integrations/dnc';
import { IntegrateReconciliationController } from './integrate-reconciliation.controller';
import { IntegrateReconciliationService } from './integrate-reconciliation.service';
import { CaptchaModule } from '../captcha/captcha.module';

@Module({
  imports: [DncModule, CaptchaModule],
  controllers: [IntegrateReconciliationController],
  providers: [IntegrateReconciliationService],
})
export class IntegrateReconciliationModule {}
