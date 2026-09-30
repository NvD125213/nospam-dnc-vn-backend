import { Injectable } from '@nestjs/common';
import { DncClient } from '../../integrations/dnc';
import type { DncEnvelope } from '../../integrations/dnc';

export type ComplainExcelZip = {
  fromDate: string;
  toDate: string;
};

export type ComplainStatusFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

export type ComplainImportStatusResult = DncEnvelope & {
  content?: unknown;
};

export type ComplainTypeItem = {
  id: string | number;
  name: string;
};

export type ComplainListTypeResult = DncEnvelope & {
  content?: ComplainTypeItem[];
};

export type ComplainAdd = {
  smsContent: string;
  prefPhoneNumber: string;
  complainType: string;
  ownerPhone: string;
  evidenceFile?: string;
};

@Injectable()
export class IntegrateComplainService {
  constructor(private readonly dnc: DncClient) {}

  // Tải file Excel phản ánh tin nhắn/cuộc gọi rác. Không yêu cầu chữ ký.
  excelZip(input: ComplainExcelZip): Promise<any> {
    return this.dnc.download({
      method: 'POST',
      path: 'integrate/complain/excel-zip',
      body: {
        fromDate: input.fromDate,
        toDate: input.toDate,
      },
    });
  }

  // Cập nhật trạng thái phản ánh bằng file Excel. Không yêu cầu chữ ký.
  importStatus(file: ComplainStatusFile): Promise<ComplainImportStatusResult> {
    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(file.buffer)], {
        type:
          file.mimetype ||
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      file.originalname,
    );

    return this.dnc.request<ComplainImportStatusResult>({
      method: 'POST',
      path: 'integrate/complain/excel-import-status',
      form,
    });
  }

  // Danh mục loại phản ánh. Không yêu cầu chữ ký.
  listType(): Promise<ComplainListTypeResult> {
    return this.dnc.request<ComplainListTypeResult>({
      method: 'GET',
      path: 'integrate/complain/get-list-type',
    });
  }

  // Thêm mới phản ánh. Chữ ký lấy từ SIGNATURE.
  add(input: ComplainAdd): Promise<DncEnvelope> {
    return this.dnc.request({
      method: 'POST',
      path: 'integrate/complain/add',
      body: {
        smsContent: input.smsContent,
        prefPhoneNumber: input.prefPhoneNumber,
        complainType: input.complainType,
        ownerPhone: input.ownerPhone,
        evidenceFile: input.evidenceFile,
        signature: this.dnc.signature,
      },
    });
  }
}
