import { BadRequestException, Injectable } from '@nestjs/common';
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
  prefixNumber: string;
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
  listType(): Promise<ComplainListTypeResult | ComplainTypeItem[]> {
    return this.dnc.request<ComplainListTypeResult | ComplainTypeItem[]>({
      method: 'GET',
      path: 'integrate/complain/get-list-type',
    });
  }

  private normalizeComplainTypes(
    payload: ComplainListTypeResult | ComplainTypeItem[] | null | undefined,
  ): ComplainTypeItem[] {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.content)) return payload.content;
    return [];
  }

  // Thêm mới phản ánh. Chữ ký lấy từ SIGNATURE.
  async add(input: ComplainAdd): Promise<DncEnvelope> {
    const complainType = input.complainType?.trim();
    if (!complainType) {
      throw new BadRequestException('Thiếu loại phản ánh');
    }

    const types = this.normalizeComplainTypes(await this.listType());
    const matched = types.some(
      (item) => String(item?.id ?? '').trim() === complainType,
    );
    if (!matched) {
      throw new BadRequestException(
        'Loại phản ánh không hợp lệ hoặc không nằm trong danh mục',
      );
    }

    return this.dnc.request({
      method: 'POST',
      path: 'integrate/complain/add',
      body: {
        smsContent: input.smsContent,
        prefixNumber: input.prefixNumber,
        complainType,
        ownerPhone: input.ownerPhone,
        evidenceFile: input.evidenceFile,
        signature: this.dnc.signature,
      },
    });
  }
}
