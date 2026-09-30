import { Module } from '@nestjs/common';
import { DncModule } from '../../integrations/dnc';
import { IntegrateComplainController } from './integrate-complain.controller';
import { IntegrateComplainService } from './integrate-complain.service';

@Module({
  imports: [DncModule],
  controllers: [IntegrateComplainController],
  providers: [IntegrateComplainService],
})
export class IntegrateComplainModule {}
