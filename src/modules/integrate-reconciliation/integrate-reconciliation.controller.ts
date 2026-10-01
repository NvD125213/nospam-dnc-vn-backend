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
import { CaptchaService } from '../captcha/captcha.service';
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
    private readonly captchaService: CaptchaService,
  ) {}

  @Post('reconciliation/upload-file')
  @ApiOperation({ summary: 'Upload file hậu kiểm' })
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
  @ApiOkResponse({ type: ReconciliationUploadResultDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileController(
    @UploadedFile() file: ReconciliationUploadFile,
    @Body('captchaToken') captchaToken: string,
  ): Promise<ReconciliationUploadResultDto> {
    await this.captchaService.verify(captchaToken);
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
  async createController(
    @Body() body: ReconciliationCreateDto,
  ): Promise<ReconciliationResultDto> {
    await this.captchaService.verify(body.captchaToken);
    return this.integrateReconciliationService.create({
      fileUrl: body.fileUrl,
      callbackUrl: body.callbackUrl,
    });
  }

  @Post('reconciliation/check-recon')
  @ApiOperation({ summary: 'Kiểm tra trạng thái yêu cầu hậu kiểm' })
  @ApiOkResponse({ type: ReconciliationCheckResultDto })
  async checkReconController(
    @Body() body: ReconciliationCheckDto,
  ): Promise<ReconciliationCheckResultDto> {
    await this.captchaService.verify(body.captchaToken);
    return this.integrateReconciliationService.checkRecon({
      requestId: body.requestId,
    });
  }
}
