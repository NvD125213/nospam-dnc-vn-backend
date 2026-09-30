import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ComplainExcelZipDto {
  @ApiProperty({ example: '01/01/2026 00:00:00' })
  fromDate!: string;

  @ApiProperty({ example: '31/01/2026 23:59:59' })
  toDate!: string;
}

export class ComplainAddDto {
  @ApiProperty()
  smsContent!: string;

  @ApiProperty({ example: '0900000000' })
  prefPhoneNumber!: string;

  @ApiProperty()
  complainType!: string;

  @ApiProperty({ example: '0900000001' })
  ownerPhone!: string;

  @ApiPropertyOptional()
  evidenceFile?: string;
}

export class ComplainTypeItemDto {
  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'number' }] })
  id!: string | number;

  @ApiProperty()
  name!: string;
}

export class ComplainResultDto {
  @ApiProperty({ example: 200 })
  code!: number;

  @ApiProperty({ example: 'OK' })
  status!: string;

  @ApiPropertyOptional()
  timestamp?: string;

  @ApiPropertyOptional()
  msg_success?: string;
}

export class ComplainImportStatusResultDto extends ComplainResultDto {
  @ApiPropertyOptional({
    description: 'Bản ghi import từ file trạng thái.',
  })
  content?: unknown;
}

export class ComplainListTypeResultDto extends ComplainResultDto {
  @ApiPropertyOptional({ type: [ComplainTypeItemDto] })
  content?: ComplainTypeItemDto[];
}
