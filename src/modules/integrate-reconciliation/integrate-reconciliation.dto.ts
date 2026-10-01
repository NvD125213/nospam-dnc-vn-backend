import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WithCaptchaDto } from '../captcha/captcha.dto';

export class ReconciliationCreateDto extends WithCaptchaDto {
  @ApiProperty()
  fileUrl!: string;

  @ApiProperty()
  callbackUrl!: string;
}

export class ReconciliationCheckDto extends WithCaptchaDto {
  @ApiProperty()
  requestId!: string;
}

export class ReconciliationUploadResultDto {
  @ApiPropertyOptional()
  content?: unknown;

  @ApiPropertyOptional()
  fileUrl?: string;

  @ApiPropertyOptional({ example: 200 })
  code?: number;

  @ApiPropertyOptional()
  msg_success?: string;
}

export class ReconciliationResultDto {
  @ApiProperty({ example: 200 })
  code!: number;

  @ApiProperty({ example: 'OK' })
  status!: string;

  @ApiPropertyOptional()
  timestamp?: string;

  @ApiPropertyOptional()
  msg_success?: string;
}

export class ReconciliationCheckResultDto extends ReconciliationResultDto {
  @ApiPropertyOptional()
  requestId?: string;

  @ApiPropertyOptional()
  requestDate?: string;

  @ApiPropertyOptional()
  totalPhoneNumber?: number;
}
