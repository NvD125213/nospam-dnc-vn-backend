import { ApiProperty } from '@nestjs/swagger';

export class WithCaptchaDto {
  @ApiProperty({
    description: 'Token reCAPTCHA từ frontend',
  })
  captchaToken!: string;
}
