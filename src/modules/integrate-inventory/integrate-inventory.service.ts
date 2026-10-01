import { BadRequestException, Injectable } from '@nestjs/common';
import { DncClient } from '../../integrations/dnc';
import type { DncEnvelope } from '../../integrations/dnc';

export type TelPartnerCodeUpdate =
  'VIETTEL' | 'MOBIFONE' | 'ITEL' | 'GMOBILE' | 'VINAPHONE' | 'VIETNAMMOBILE';

export type InventoryExcelZip = {
  fromDate: string;
  toDate: string;
};

export type InventoryTelcoUpdate = {
  phoneNumber: string;
  telPartnerCodeUpdate: TelPartnerCodeUpdate;
};

@Injectable()
export class IntegrateInventoryService {
  constructor(private readonly dnc: DncClient) {}

  // Tải file Excel kho dữ liệu theo khoảng thời gian. Không yêu cầu chữ ký.
  excelZip(input: InventoryExcelZip): Promise<any> {
    return this.dnc.download({
      method: 'POST',
      path: 'integrate/inventory/excel-zip',
      body: {
        fromDate: input.fromDate,
        toDate: input.toDate,
      },
    });
  }

  // Cập nhật thuê bao giữ số đổi mạng. Chữ ký lấy từ SIGNATURE.
  updateTelco(input: InventoryTelcoUpdate): Promise<DncEnvelope> {
    const allowedTelPartnerCodes = [
      'VIETTEL',
      'MOBIFONE',
      'ITEL',
      'GMOBILE',
      'VINAPHONE',
      'VIETNAMMOBILE',
    ];

    if (!allowedTelPartnerCodes.includes(input.telPartnerCodeUpdate)) {
      throw new BadRequestException('Mã nhà mạng không hợp lệ');
    }

    return this.dnc.request({
      method: 'POST',
      path: 'integrate/inventory/update-telco',
      body: {
        phoneNumber: input.phoneNumber,
        telPartnerCodeUpdate: input.telPartnerCodeUpdate,
        signature: this.dnc.signature,
      },
    });
  }
}
