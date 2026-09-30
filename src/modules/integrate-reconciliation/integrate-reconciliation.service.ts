import { Injectable } from '@nestjs/common';
import { DncClient } from '../../integrations/dnc';
import type { DncEnvelope } from '../../integrations/dnc';

export type ReconciliationUploadFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

export type ReconciliationUploadResult = DncEnvelope & {
  content?: unknown;
  fileUrl?: string;
};

export type ReconciliationCreate = {
  fileUrl: string;
  callbackUrl: string;
};

export type ReconciliationCheck = {
  requestId: string;
};

export type ReconciliationCheckResult = DncEnvelope & {
  requestId?: string;
  requestDate?: string;
  totalPhoneNumber?: number;
};

@Injectable()
export class IntegrateReconciliationService {
  constructor(private readonly dnc: DncClient) {}

  // Upload file CSV hậu kiểm. Không yêu cầu chữ ký.
  uploadFile(
    file: ReconciliationUploadFile,
  ): Promise<ReconciliationUploadResult> {
    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(file.buffer)], {
        type: file.mimetype || 'text/csv',
      }),
      file.originalname,
    );

    return this.dnc.request<ReconciliationUploadResult>({
      method: 'POST',
      path: 'integrate/reconciliation/upload-file',
      form,
    });
  }

  // Tạo phiên hậu kiểm. Chữ ký lấy từ SIGNATURE.
  create(input: ReconciliationCreate): Promise<DncEnvelope> {
    return this.dnc.request({
      method: 'POST',
      path: 'integrate/reconciliation/create',
      body: {
        fileUrl: input.fileUrl,
        callbackUrl: input.callbackUrl,
        signature: this.dnc.signature,
      },
    });
  }

  // Kiểm tra trạng thái yêu cầu hậu kiểm. Chữ ký lấy từ SIGNATURE.
  checkRecon(input: ReconciliationCheck): Promise<ReconciliationCheckResult> {
    return this.dnc.request<ReconciliationCheckResult>({
      method: 'POST',
      path: 'integrate/reconciliation/check-recon',
      body: {
        requestId: input.requestId,
        signature: this.dnc.signature,
      },
    });
  }
}
