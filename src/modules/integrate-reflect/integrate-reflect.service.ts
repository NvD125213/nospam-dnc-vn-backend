import { BadRequestException, Injectable } from '@nestjs/common';
import { DncClient } from '../../integrations/dnc';
import type { DncEnvelope } from '../../integrations/dnc';

export type ReflectRequestType = 'REGISTER' | 'UNREGISTER';
export type ReflectTypeCode = 'SMS' | 'CALL' | 'BOTH';

export type ReflectItem = {
  cusPhone: string;
  reflectFormCode?: string;
  reflectTypeCode: ReflectTypeCode;
  requestType: ReflectRequestType;
};

export type ReflectResult = {
  code: number;
  status: string;
  timestamp: string;
  msg_success: string;
};

const MAX_ITEMS = 50;

@Injectable()
export class IntegrateReflectService {
  constructor(private readonly dnc: DncClient) {}

  // Hàm xử lý logic ghi nhận phản ánh DNC: Truyền phản ánh đơn
  async addOne(item: ReflectItem): Promise<DncEnvelope> {
    // cusPhone: bắt buộc, kiểu string
    const cusPhone = item.cusPhone?.trim();
    if (!cusPhone) {
      throw new BadRequestException(
        'Cần nhập số điện thoại người gửi phản ánh',
      );
    }
    // reflectTypeCode: bắt buộc, chỉ nhận SMS | CALL | BOTH
    if (!item.reflectTypeCode) {
      throw new BadRequestException(
        'Cần chọn loại: tin nhắn, cuộc gọi, hoặc cả hai',
      );
    }
    if (!['SMS', 'CALL', 'BOTH'].includes(item.reflectTypeCode)) {
      throw new BadRequestException(
        'Loại đăng ký chỉ được là tin nhắn (SMS), cuộc gọi (CALL), hoặc cả hai (BOTH)',
      );
    }

    // requestType: bắt buộc, chỉ nhận REGISTER | UNREGISTER
    if (!item.requestType) {
      throw new BadRequestException(
        'Cần chọn đăng ký chặn quảng cáo hoặc hủy đăng ký',
      );
    }
    if (!['REGISTER', 'UNREGISTER'].includes(item.requestType)) {
      throw new BadRequestException(
        'Loại phản ánh chỉ được là đăng ký chặn (REGISTER) hoặc hủy đăng ký (UNREGISTER)',
      );
    }

    return this.dnc.request<DncEnvelope>({
      method: 'POST',
      path: 'integrate/reflect-add-one',
      body: {
        cusPhone: item.cusPhone,
        reflectFormCode: item.reflectFormCode,
        reflectTypeCode: item.reflectTypeCode,
        requestType: item.requestType,
        signature: this.dnc.signature,
      },
    });
  }

  private validateItem(item: ReflectItem, index: number): string[] {
    const errors: string[] = [];

    // Định danh dòng: ưu tiên số điện thoại, không có thì dùng số dòng
    const phone =
      typeof item?.cusPhone === 'string' ? item.cusPhone.trim() : '';
    const label = phone || `Dòng ${index + 1}`;

    // cusPhone: bắt buộc, kiểu string
    if (!phone) {
      errors.push(`${label}: Cần nhập số điện thoại người gửi phản ánh`);
    }

    // reflectTypeCode: bắt buộc, chỉ nhận SMS | CALL | BOTH
    if (!item?.reflectTypeCode) {
      errors.push(`${label}: Cần chọn loại: tin nhắn, cuộc gọi, hoặc cả hai`);
    } else if (!['SMS', 'CALL', 'BOTH'].includes(item.reflectTypeCode)) {
      errors.push(
        `${label}: Loại chỉ được là tin nhắn (SMS), cuộc gọi (CALL), hoặc cả hai (BOTH)`,
      );
    }

    // requestType: bắt buộc, chỉ nhận REGISTER | UNREGISTER
    if (!item?.requestType) {
      errors.push(`${label}: Cần chọn đăng ký chặn quảng cáo hoặc hủy đăng ký`);
    } else if (!['REGISTER', 'UNREGISTER'].includes(item.requestType)) {
      errors.push(
        `${label}: Loại phản ánh chỉ được là đăng ký chặn (REGISTER) hoặc hủy đăng ký (UNREGISTER)`,
      );
    }

    return errors;
  }

  // Hàm xử lý logic ghi nhận phản ánh DNC: Truyền nhiều phản ánh
  async addMany(importData: ReflectItem[]): Promise<DncEnvelope> {
    // Kiểm tra mảng
    if (!Array.isArray(importData) || importData.length === 0) {
      throw new BadRequestException('Danh sách phản ánh không được trống');
    }
    if (importData.length > MAX_ITEMS) {
      throw new BadRequestException(
        'Danh sách phản ánh không được vượt quá 50 số',
      );
    }

    // Kiểm tra từng dòng
    const errors = importData.flatMap((item, index) =>
      this.validateItem(item, index),
    );

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return this.dnc.request<DncEnvelope>({
      method: 'POST',
      path: 'integrate/reflect-add-many',
      body: {
        importData,
        signature: this.dnc.signature,
      },
    });
  }
}
