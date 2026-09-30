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

  // Hàm xử lý logic ghi nhận phản ánh DNC: Truyền nhiều phản ánh
  async addMany(importData: ReflectItem[]): Promise<DncEnvelope> {
    return this.dnc.request<DncEnvelope>({
      method: 'POST',
      path: 'integrate/reflect-add-many',
      body: {
        importData,
      },
    });
  }
}
