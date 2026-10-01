import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { HealthModule } from './modules/health/health.module';
import { DncModule } from './integrations/dnc';
import { IntegrateReflectModule } from './modules/integrate-reflect/integrate-reflect.module';
import { IntegrateInventoryModule } from './modules/integrate-inventory/integrate-inventory.module';
import { IntegrateReconciliationModule } from './modules/integrate-reconciliation/integrate-reconciliation.module';
import { IntegrateComplainModule } from './modules/integrate-complain/integrate-complain.module';
import { CaptchaModule } from './modules/captcha/captcha.module';

@Module({
  imports: [
    AppConfigModule,
    DncModule,
    HealthModule,
    IntegrateReflectModule,
    IntegrateInventoryModule,
    IntegrateReconciliationModule,
    IntegrateComplainModule,
    CaptchaModule,
  ],
})
export class AppModule {}
