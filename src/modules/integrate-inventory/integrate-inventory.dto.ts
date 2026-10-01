import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WithCaptchaDto } from '../captcha/captcha.dto';
import type { TelPartnerCodeUpdate } from './integrate-inventory.service';

const TEL_PARTNERS = [
  'VIETTEL',
  'MOBIFONE',
  'VINAPHONE',
  'VIETNAM MOBILE',
  'GTEL',
  'ITEL',
  'REDDI',
] as const;

export class InventoryExcelZipDto extends WithCaptchaDto {
  @ApiProperty({ example: '01/01/2026 00:00:00' })
  fromDate!: string;

  @ApiProperty({ example: '31/01/2026 23:59:59' })
  toDate!: string;
}

export class InventoryTelcoUpdateDto extends WithCaptchaDto {
  @ApiProperty({ example: '0900000000' })
  phoneNumber!: string;

  @ApiProperty({ enum: TEL_PARTNERS, example: 'VIETTEL' })
  telPartnerCodeUpdate!: TelPartnerCodeUpdate;
}

export class InventoryResultDto {
  @ApiProperty({ example: 200 })
  code!: number;

  @ApiProperty({ example: 'OK' })
  status!: string;

  @ApiPropertyOptional()
  timestamp?: string;

  @ApiPropertyOptional()
  msg_success?: string;
}
