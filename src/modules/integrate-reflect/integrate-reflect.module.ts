import { Module } from '@nestjs/common';
import { DncModule } from '../../integrations/dnc';
import { IntegrateReflectController } from './integrate-reflect.controller';
import { IntegrateReflectService } from './integrate-reflect.service';

@Module({
  imports: [DncModule],
  controllers: [IntegrateReflectController],
  providers: [IntegrateReflectService],
})
export class IntegrateReflectModule {}
