import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ReflectItemDto,
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
  ) {}

  @Post('reflect-add-one')
  @ApiOperation({ summary: 'Truyền phản ánh đơn' })
  @ApiOkResponse({ type: ReflectResultDto })
  addOneController(@Body() body: ReflectItemDto): Promise<DncEnvelope> {
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
  addManyController(@Body() body: ReflectManyDto): Promise<DncEnvelope> {
    return this.integrateReflectService.addMany(body.importData);
  }
}
