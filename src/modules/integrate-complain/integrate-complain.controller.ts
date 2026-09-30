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
import {
  ComplainAddDto,
  ComplainExcelZipDto,
  ComplainImportStatusResultDto,
  ComplainListTypeResultDto,
  ComplainResultDto,
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
  ) {}

  @Post('complain/excel-zip')
  @ApiOperation({ summary: 'Tải file Excel phản ánh tin nhắn/cuộc gọi rác' })
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  async excelZipController(
    @Body() body: ComplainExcelZipDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
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
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ type: ComplainImportStatusResultDto })
  @UseInterceptors(FileInterceptor('file'))
  importStatusController(
    @UploadedFile() file: ComplainStatusFile,
  ): Promise<ComplainImportStatusResultDto> {
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
  listTypeController(): Promise<ComplainListTypeResultDto> {
    return this.integrateComplainService.listType();
  }

  @Post('complain/add')
  @ApiOperation({ summary: 'Thêm mới phản ánh' })
  @ApiOkResponse({ type: ComplainResultDto })
  addController(@Body() body: ComplainAddDto): Promise<ComplainResultDto> {
    return this.integrateComplainService.add({
      smsContent: body.smsContent,
      prefPhoneNumber: body.prefPhoneNumber,
      complainType: body.complainType,
      ownerPhone: body.ownerPhone,
      evidenceFile: body.evidenceFile,
    });
  }
}
