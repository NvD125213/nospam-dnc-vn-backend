import { Module } from '@nestjs/common';
import { APP_CONFIG } from '../../config/app-config';
import { AppConfigModule } from '../../config/config.module';
import type { AppConfig } from '../../config/parse-env';
import { DncClient } from './dnc.client';
import { DNC_CONNECTION, DNC_FETCH } from './dnc.constants';

@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: DNC_CONNECTION,
      inject: [APP_CONFIG],
      useFactory: (app: AppConfig) => app.dnc,
    },
    {
      provide: DNC_FETCH,
      useFactory: () => fetch,
    },
    DncClient,
  ],
  exports: [DncClient],
})
export class DncModule {}
