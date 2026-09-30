import { Module } from '@nestjs/common';
import { DncModule } from '../../integrations/dnc';
import { IntegrateInventoryController } from './integrate-inventory.controller';
import { IntegrateInventoryService } from './integrate-inventory.service';

@Module({
  imports: [DncModule],
  controllers: [IntegrateInventoryController],
  providers: [IntegrateInventoryService],
})
export class IntegrateInventoryModule {}
