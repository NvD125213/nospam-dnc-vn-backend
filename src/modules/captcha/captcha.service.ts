import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

interface RecaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  score?: number;
  action?: string;
  'error-codes'?: string[];
}

export type VerifyV3Options = {
  /** Tên action gửi từ frontend (grecaptcha.execute). */
  action?: string;
  /** Điểm tối thiểu chấp nhận (0–1). Mặc định 0.5. */
  minScore?: number;
};

@Injectable()
export class CaptchaService {
  private readonly verifyUrl =
    'https://www.google.com/recaptcha/api/siteverify';

  private readonly defaultV3MinScore = 0.5;

  /** Xác thực reCAPTCHA v2 (checkbox). */
  async verify(token: string): Promise<void> {
    const result = await this.siteVerify(
      token,
      process.env.RECAPTCHA_SECRET_KEY,
      'RECAPTCHA_SECRET_KEY',
    );

    if (!result.success) {
      throw new BadRequestException(
        this.formatFailure('Xác thực CAPTCHA thất bại', result),
      );
    }
  }

  /** Xác thực reCAPTCHA v3 (invisible + score). */
  async verifyV3(token: string, options: VerifyV3Options = {}): Promise<void> {
    const result = await this.siteVerify(
      token,
      process.env.RECAPTCHA_SECRET_KEY_V3,
      'RECAPTCHA_SECRET_KEY_V3',
    );

    if (!result.success) {
      throw new BadRequestException(
        this.formatFailure('Xác thực CAPTCHA v3 thất bại', result),
      );
    }

    if (options.action) {
      const expected = options.action.trim();
      const actual = String(result.action || '').trim();
      if (!actual || actual !== expected) {
        throw new BadRequestException(
          `CAPTCHA v3 action không khớp (nhận: ${actual || 'trống'}, kỳ vọng: ${expected})`,
        );
      }
    }

    const minScore = this.resolveMinScore(options.minScore);
    const score = typeof result.score === 'number' ? result.score : NaN;
    if (!Number.isFinite(score) || score < minScore) {
      throw new BadRequestException(
        `CAPTCHA v3 score quá thấp (${Number.isFinite(score) ? score : 'không có'} < ${minScore})`,
      );
    }
  }

  private resolveMinScore(override?: number): number {
    if (typeof override === 'number' && Number.isFinite(override)) {
      return Math.min(1, Math.max(0, override));
    }
    const fromEnv = Number(process.env.RECAPTCHA_V3_MIN_SCORE);
    if (Number.isFinite(fromEnv)) {
      return Math.min(1, Math.max(0, fromEnv));
    }
    return this.defaultV3MinScore;
  }

  private async siteVerify(
    token: string,
    secret: string | undefined,
    secretEnvName: string,
  ): Promise<RecaptchaResponse> {
    if (!token?.trim()) {
      throw new BadRequestException('Yêu cầu token CAPTCHA');
    }

    if (!secret?.trim()) {
      throw new InternalServerErrorException(
        `Chưa có cấu hình khóa bí mật Recaptcha (${secretEnvName})`,
      );
    }

    const body = new URLSearchParams({
      secret: secret.trim(),
      response: token.trim(),
    });

    let response: Response;
    try {
      response = await fetch(this.verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });
    } catch {
      throw new InternalServerErrorException(
        'Không kết nối được dịch vụ xác thực CAPTCHA',
      );
    }

    if (!response.ok) {
      throw new InternalServerErrorException('Lỗi khi xác thực CAPTCHA');
    }

    return (await response.json()) as RecaptchaResponse;
  }

  private formatFailure(prefix: string, result: RecaptchaResponse): string {
    const codes = result['error-codes'];
    if (Array.isArray(codes) && codes.length) {
      return `${prefix}: ${codes.join(', ')}`;
    }
    return prefix;
  }
}
