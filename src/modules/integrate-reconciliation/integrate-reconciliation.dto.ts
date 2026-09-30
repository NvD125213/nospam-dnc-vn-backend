import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReconciliationCreateDto {
  @ApiProperty()
  fileUrl!: string;

  @ApiProperty()
  callbackUrl!: string;
}

export class ReconciliationCheckDto {
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
