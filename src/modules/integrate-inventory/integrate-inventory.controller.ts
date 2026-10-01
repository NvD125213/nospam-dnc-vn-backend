import { Body, Controller, Post, Res, StreamableFile } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { isDncFile } from '../../integrations/dnc';
import { CaptchaService } from '../captcha/captcha.service';
import {
  InventoryExcelZipDto,
  InventoryTelcoUpdateDto,
  InventoryResultDto,
} from './integrate-inventory.dto';
import { IntegrateInventoryService } from './integrate-inventory.service';

@ApiTags('Kho dữ liệu DNC')
@Controller('integrate')
export class IntegrateInventoryController {
  constructor(
    private readonly integrateInventoryService: IntegrateInventoryService,
    private readonly captchaService: CaptchaService,
  ) {}

  // Controller tải file Excel kho dữ liệu
  @Post('inventory/excel-zip')
  @ApiOperation({ summary: 'Tải file Excel kho dữ liệu' })
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  async excelZipController(
    @Body() body: InventoryExcelZipDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    await this.captchaService.verify(body.captchaToken);
    const { fromDate, toDate } = body;
    const result = await this.integrateInventoryService.excelZip({
      fromDate,
      toDate,
    });
    if (!isDncFile(result)) {
      throw new Error('Invalid file download result');
    }
    res.setHeader('Content-Type', result.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.fileName}"`,
    );
    return new StreamableFile(result.data);
  }

  // Controller cập nhật thuê bao giữ số đổi mạng
  @Post('inventory/update-telco')
  @ApiOperation({ summary: 'Cập nhật thuê bao giữ số đổi mạng' })
  @ApiOkResponse({ type: InventoryResultDto })
  async updateTelcoController(
    @Body() body: InventoryTelcoUpdateDto,
  ): Promise<InventoryResultDto> {
    await this.captchaService.verify(body.captchaToken);
    return this.integrateInventoryService.updateTelco({
      phoneNumber: body.phoneNumber,
      telPartnerCodeUpdate: body.telPartnerCodeUpdate,
    });
  }
}
