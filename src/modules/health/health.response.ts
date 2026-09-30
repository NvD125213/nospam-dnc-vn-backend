import { ApiProperty } from '@nestjs/swagger';

export class DncConnectionStatusDto {
  @ApiProperty({ enum: ['live', 'sandbox'], example: 'live' })
  environment!: 'live' | 'sandbox';

  @ApiProperty({ example: 'https://nospam.vncert.vn/api/v1' })
  baseUrl!: string;
}

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';

  @ApiProperty({ type: DncConnectionStatusDto })
  dnc!: DncConnectionStatusDto;
}
