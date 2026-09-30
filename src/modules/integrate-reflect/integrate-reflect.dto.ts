import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  ReflectRequestType,
  ReflectTypeCode,
} from './integrate-reflect.service';

export class ReflectItemDto {
  @ApiProperty({ example: '0900000000' })
  cusPhone!: string;

  @ApiPropertyOptional({
    example: 'SMS',
    description: 'Nguồn phản ánh. Bỏ trống thì mặc định SMS.',
  })
  reflectFormCode?: string;

  @ApiProperty({ enum: ['SMS', 'CALL', 'BOTH'], example: 'SMS' })
  reflectTypeCode!: ReflectTypeCode;

  @ApiProperty({ enum: ['REGISTER', 'UNREGISTER'], example: 'REGISTER' })
  requestType!: ReflectRequestType;
}

export class ReflectManyDto {
  @ApiProperty({ type: [ReflectItemDto] })
  importData!: ReflectItemDto[];
}

export class ReflectResultDto {
  @ApiProperty({ example: 200 })
  code!: number;

  @ApiProperty({ example: 'OK' })
  status!: string;

  @ApiProperty({ example: '22/07/2025 16:13:17' })
  timestamp!: string;

  @ApiProperty({ example: 'Thành công' })
  msg_success!: string;
}
