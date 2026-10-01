import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { isDncFile } from '../../integrations/dnc';
import { CaptchaService } from '../captcha/captcha.service';
import {
  ComplainAddDto,
  ComplainExcelZipDto,
  ComplainImportStatusResultDto,
  ComplainListTypeResultDto,
  ComplainResultDto,
  ComplainTypeItemDto,
} from './integrate-complain.dto';
import {
  IntegrateComplainService,
  type ComplainStatusFile,
} from './integrate-complain.service';

@ApiTags('Phản ánh tin nhắn rác / cuộc gọi rác')
@Controller('integrate')
export class IntegrateComplainController {
  constructor(
    private readonly integrateComplainService: IntegrateComplainService,
    private readonly captchaService: CaptchaService,
  ) {}

  @Post('complain/excel-zip')
  @ApiOperation({ summary: 'Tải file Excel phản ánh tin nhắn/cuộc gọi rác' })
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  async excelZipController(
    @Body() body: ComplainExcelZipDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    await this.captchaService.verify(body.captchaToken);
    const result = await this.integrateComplainService.excelZip({
      fromDate: body.fromDate,
      toDate: body.toDate,
    });
    if (!isDncFile(result)) {
      throw new Error('Kết quả tải xuống không hợp lệ');
    }
    res.setHeader('Content-Type', result.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.fileName}"`,
    );
    return new StreamableFile(result.data);
  }

  @Post('complain/excel-import-status')
  @ApiOperation({
    summary: 'Cập nhật trạng thái phản ánh',
    description:
      'File Excel. Trạng thái: NEW, BLOCK1, BLOCK2, RECALL, NO_PROCESS.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'captchaToken'],
      properties: {
        file: { type: 'string', format: 'binary' },
        captchaToken: {
          type: 'string',
          description: 'Token reCAPTCHA từ frontend',
        },
      },
    },
  })
  @ApiOkResponse({ type: ComplainImportStatusResultDto })
  @UseInterceptors(FileInterceptor('file'))
  async importStatusController(
    @UploadedFile() file: ComplainStatusFile,
    @Body('captchaToken') captchaToken: string,
  ): Promise<ComplainImportStatusResultDto> {
    await this.captchaService.verify(captchaToken);
    if (!file?.buffer) {
      throw new BadRequestException('Thiếu file Excel');
    }

    return this.integrateComplainService.importStatus({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
    });
  }

  @Get('complain/get-list-type')
  @ApiOperation({ summary: 'Lấy danh sách loại phản ánh' })
  @ApiOkResponse({ type: ComplainListTypeResultDto })
  listTypeController(): Promise<
    ComplainListTypeResultDto | ComplainTypeItemDto[]
  > {
    return this.integrateComplainService.listType();
  }

  @Post('complain/add')
  @ApiOperation({ summary: 'Thêm mới phản ánh' })
  @ApiOkResponse({ type: ComplainResultDto })
  async addController(
    @Body() body: ComplainAddDto,
  ): Promise<ComplainResultDto> {
    await this.captchaService.verify(body.captchaToken);
    return this.integrateComplainService.add({
      smsContent: body.smsContent,
      prefixNumber: body.prefixNumber,
      complainType: body.complainType,
      ownerPhone: body.ownerPhone,
      evidenceFile: body.evidenceFile,
    });
  }
}
