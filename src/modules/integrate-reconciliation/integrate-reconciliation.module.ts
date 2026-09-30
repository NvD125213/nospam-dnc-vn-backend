import { Module } from '@nestjs/common';
import { DncModule } from '../../integrations/dnc';
import { IntegrateReconciliationController } from './integrate-reconciliation.controller';
import { IntegrateReconciliationService } from './integrate-reconciliation.service';

@Module({
  imports: [DncModule],
  controllers: [IntegrateReconciliationController],
  providers: [IntegrateReconciliationService],
})
export class IntegrateReconciliationModule {}
