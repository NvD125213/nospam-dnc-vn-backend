import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CaptchaService } from '../captcha/captcha.service';
import {
  ReflectAddOneDto,
  ReflectManyDto,
  ReflectResultDto,
} from './integrate-reflect.dto';
import { IntegrateReflectService } from './integrate-reflect.service';
import { DncEnvelope } from 'src/integrations/dnc';

@ApiTags('Ghi nhận phản ánh DNC')
@Controller('integrate')
export class IntegrateReflectController {
  constructor(
    private readonly integrateReflectService: IntegrateReflectService,
    private readonly captchaService: CaptchaService,
  ) {}

  @Post('reflect-add-one')
  @ApiOperation({ summary: 'Truyền phản ánh đơn' })
  @ApiOkResponse({ type: ReflectResultDto })
  async addOneController(@Body() body: ReflectAddOneDto): Promise<DncEnvelope> {
    await this.captchaService.verify(body.captchaToken);
    return this.integrateReflectService.addOne({
      cusPhone: body.cusPhone,
      reflectFormCode: body.reflectFormCode,
      reflectTypeCode: body.reflectTypeCode,
      requestType: body.requestType,
    });
  }

  @Post('reflect-add-many')
  @ApiOperation({ summary: 'Truyền phản ánh theo danh sách' })
  @ApiOkResponse({ type: ReflectResultDto })
  async addManyController(@Body() body: ReflectManyDto): Promise<DncEnvelope> {
    await this.captchaService.verify(body.captchaToken);
    return this.integrateReflectService.addMany(body.importData);
  }
}
