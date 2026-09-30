import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { APP_CONFIG } from '../../config/app-config';
import type { AppConfig } from '../../config/parse-env';
import { HealthResponseDto } from './health.response';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@Inject(APP_CONFIG) private readonly appConfig: AppConfig) {}

  @Get()
  @ApiOperation({ summary: 'Kiểm tra trạng thái hoạt động của hệ thống' })
  @ApiOkResponse({ type: HealthResponseDto })
  check(): HealthResponseDto {
    return {
      status: 'ok',
      dnc: {
        environment: this.appConfig.dnc.environment,
        baseUrl: this.appConfig.dnc.baseUrl,
      },
    };
  }
}
