import {
  BadRequestException,
  Body,
  Controller,
  Post,
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
import {
  ReconciliationCheckDto,
  ReconciliationCheckResultDto,
  ReconciliationCreateDto,
  ReconciliationResultDto,
  ReconciliationUploadResultDto,
} from './integrate-reconciliation.dto';
import {
  IntegrateReconciliationService,
  type ReconciliationUploadFile,
} from './integrate-reconciliation.service';

@ApiTags('Hậu kiểm DNC')
@Controller('integrate')
export class IntegrateReconciliationController {
  constructor(
    private readonly integrateReconciliationService: IntegrateReconciliationService,
  ) {}

  @Post('reconciliation/upload-file')
  @ApiOperation({ summary: 'Upload file hậu kiểm' })
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
  @ApiOkResponse({ type: ReconciliationUploadResultDto })
  @UseInterceptors(FileInterceptor('file'))
  uploadFileController(
    @UploadedFile() file: ReconciliationUploadFile,
  ): Promise<ReconciliationUploadResultDto> {
    if (!file?.buffer) {
      throw new BadRequestException('Thiếu file CSV');
    }

    return this.integrateReconciliationService.uploadFile({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
    });
  }

  @Post('reconciliation/create')
  @ApiOperation({ summary: 'Thêm mới yêu cầu hậu kiểm' })
  @ApiOkResponse({ type: ReconciliationResultDto })
  createController(
    @Body() body: ReconciliationCreateDto,
  ): Promise<ReconciliationResultDto> {
    return this.integrateReconciliationService.create({
      fileUrl: body.fileUrl,
      callbackUrl: body.callbackUrl,
    });
  }

  @Post('reconciliation/check-recon')
  @ApiOperation({ summary: 'Kiểm tra trạng thái yêu cầu hậu kiểm' })
  @ApiOkResponse({ type: ReconciliationCheckResultDto })
  checkReconController(
    @Body() body: ReconciliationCheckDto,
  ): Promise<ReconciliationCheckResultDto> {
    return this.integrateReconciliationService.checkRecon({
      requestId: body.requestId,
    });
  }
}
