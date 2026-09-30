# NoSpam VN backend

Backend đối tác gọi ra hệ thống DNC của VNCert (`https://nospam.vncert.vn/api/v1`). Hợp đồng kết nối v1.0.0 nằm trong một client: ba header xác thực, envelope JSON, upload form-data và tải file ZIP. API nghiệp vụ chỉ inject client đó và chuyển tiếp từng field. `signature` do bên gọi truyền trong body, backend không tự ký.

Tài liệu API: [http://localhost:5000/docs](http://localhost:5000/docs) khi process đang chạy. Spec JSON: `/docs-json`.

## Chạy

Sao chép `.env.example` thành `.env`, điền `CLIENT-ID`, `SECRET-KEY`, `PARTNER-CODE`, rồi:

```bash
npm install
npm run start:dev
```

| Lệnh | Việc nó làm |
| --- | --- |
| `npm run start:dev` | Chạy watch, cổng lấy từ `PORT` (mặc định `5000`) |
| `npm run start` | Chạy một lần |
| `npm run build` rồi `npm run start:prod` | Biên dịch ra `dist/` rồi chạy bản build |
| `npm test` | Unit test trong `src/**/*.spec.ts` |
| `npm run test:e2e` | Boot app và gọi `GET /health` |

`.env` không được commit.

## Log

Mỗi request vào app in một dòng khi response đã gửi xong: URL hiện tại, URL gốc trên `API_URL`, và body response trả về. File ZIP chỉ ghi là binary. Không ghi header hay body request.

```text
[HTTP] GET /integrate/complain/get-list-type -> 200 (180ms)
{
  "url": "http://localhost:5000/integrate/complain/get-list-type",
  "upstreamUrl": "https://nospam.vncert.vn/api/v1/integrate/complain/get-list-type",
  "response": []
}
```

`2xx` là log, `4xx` là warn, `5xx` là error. Request không gọi DNC thì `upstreamUrl` là `null`.

Body JSON từ DNC được trả nguyên cho client, kể cả khi không có `code`/`status` hoặc `code` khác 200. Chỉ lỗi kết nối (không nhận được response) thành HTTP 502. Lỗi 500 còn được filter ghi thêm message.

Khi process khởi động, client in một dòng `môi trường` và `baseUrl`.

## Cấu trúc

```
backend/
  .env.example
  .gitignore
  .prettierrc
  eslint.config.mjs
  nest-cli.json
  package.json
  tsconfig.json
  tsconfig.build.json
  README.md
  src/
    main.ts
    app.module.ts
    config/
      app-config.ts
      config.module.ts
      parse-env.ts
      parse-env.spec.ts
    common/
      filters/
        all-exceptions.filter.ts
      middleware/
        request-log.middleware.ts
      request-context.ts
    integrations/
      dnc/
        index.ts
        dnc.module.ts
        dnc.client.ts
        dnc.constants.ts
        dnc.types.ts
        dnc.errors.ts
        dnc.datetime.ts
    modules/
      health/
        health.module.ts
        health.controller.ts
        health.response.ts
      integrate-reflect/
        integrate-reflect.module.ts
        integrate-reflect.controller.ts
        integrate-reflect.service.ts
        integrate-reflect.dto.ts
      integrate-inventory/
        integrate-inventory.module.ts
        integrate-inventory.controller.ts
        integrate-inventory.service.ts
        integrate-inventory.dto.ts
      integrate-reconciliation/
        integrate-reconciliation.module.ts
        integrate-reconciliation.controller.ts
        integrate-reconciliation.service.ts
        integrate-reconciliation.dto.ts
      integrate-complain/
        integrate-complain.module.ts
        integrate-complain.controller.ts
        integrate-complain.service.ts
        integrate-complain.dto.ts
  test/
    app.e2e-spec.ts
    jest-e2e.json
```

`dist/` và `node_modules/` sinh ra khi build và cài package.

### `src/main.ts`

Tạo ứng dụng Nest, gắn middleware log request, gắn filter lỗi toàn cục, bật shutdown hook, phục vụ Swagger tại `/docs`, rồi listen cổng trong config.

### `src/app.module.ts`

Module gốc. Import `AppConfigModule`, `DncModule`, `HealthModule` và bốn module `integrate-*`. Không chứa logic nghiệp vụ.

### `src/config/`

Đọc môi trường một lần lúc boot. Thiếu base URL, client id, secret hoặc partner code thì process không lên.

| File | Chức năng |
| --- | --- |
| `parse-env.ts` | Chuẩn hóa env thành `AppConfig` |
| `app-config.ts` | Nạp `.env` (quiet) rồi gọi `parseEnv`. File được tìm từ thư mục `backend/` |
| `config.module.ts` | Đưa config vào DI qua token `APP_CONFIG` |
| `parse-env.spec.ts` | Test đọc đúng các biến và báo khi thiếu |

Biến được đọc: `NODE_ENV`, `PORT`, `DNC_ENVIRONMENT`, `API_URL`, `DNC_TIMEOUT_MS`, `CLIENT-ID`, `SECRET-KEY`, `PARTNER-CODE`.

`DNC_ENVIRONMENT` nhận `live` hoặc `sandbox`. Cả hai đều dùng `API_URL`. `PORT` mặc định `3000` nếu không khai báo. Timeout mặc định `15000` ms.

### `src/common/filters/`

`all-exceptions.filter.ts` là lối ra HTTP duy nhất cho lỗi không được controller bắt.

Mọi lỗi trả cùng một dạng body: `code`, `status`, `timestamp` (`dd/MM/yyyy HH:mm:ss`), `msg_error`. HTTP status trùng `code`.

| Lỗi | `code` |
| --- | --- |
| `HttpException`, gồm dữ liệu không hợp lệ | Status của Nest, thường 400 |
| `DncRejectedError` | `code` DNC trả về, mặc định 400 |
| `DncTransportError` | 502 |
| `DncConfigError` và lỗi khác | 500 |

### `src/common/middleware/`

`request-log.middleware.ts` ghi URL hiện tại, URL gốc DNC và body response. `request-context.ts` giữ URL gốc trong suốt request. Gắn trong `main.ts` trước filter, nên status trong log là status cuối cùng trả cho client.

### `src/integrations/dnc/`

Module duy nhất được phép biết cách nối DNC. Feature module import `DncModule` từ `index.ts` và inject `DncClient`.

| File | Chức năng |
| --- | --- |
| `index.ts` | Cửa public: `DncModule`, `DncClient`, ba class lỗi, kiểu `DncRequest`, `DncEnvelope`, `DncFile` |
| `dnc.module.ts` | Nối config với client và `fetch` |
| `dnc.client.ts` | Gửi request, trả nguyên body DNC, tải file, ghi URL gốc cho log request |
| `dnc.datetime.ts` | `dd/MM/yyyy HH:mm:ss` theo `Asia/Ho_Chi_Minh` |
| `dnc.types.ts` | Kiểu request, envelope và file |
| `dnc.errors.ts` | `DncConfigError`, `DncRejectedError`, `DncTransportError` |
| `dnc.constants.ts` | Token DI cho connection và hàm `fetch` |

`DncClient.request` nhận `path` tương đối so với base URL. JSON thì gắn `Content-Type: application/json`. Upload truyền `form` và không gắn `Content-Type`, để boundary của `multipart/form-data` tự sinh. `download` dùng khi DNC trả file ZIP. `formatDateTime` dùng khi body cần ngày giờ theo hợp đồng DNC. Path tuyệt đối hoặc chứa `..` bị từ chối.

Header trên mọi call: `dnc-client-id`, `dnc-secret-key`, `dnc-partner-code`.

### `src/modules/health/`

`GET /health` cho biết process sống và base URL DNC. Không gọi sang VNCert.

| File | Chức năng |
| --- | --- |
| `health.module.ts` | Đăng ký controller, dùng config |
| `health.controller.ts` | Route và mô tả Swagger |
| `health.response.ts` | Schema trả về trên `/docs` |

### `src/modules/integrate-reflect/`

Ghi nhận phản ánh. Cả hai API đều cần `signature` do bên gọi truyền.

| Route | DNC | Việc |
| --- | --- | --- |
| `POST /integrate/reflect-add-one` | `integrate/reflect-add-one` | Một phản ánh: `cusPhone`, `reflectIdFormCode`, `reflectTypeCode`, `requestType` (`REGISTER` hoặc `UNREGISTER`), `signature` |
| `POST /integrate/reflect-add-many` | `integrate/reflect-add-many` | Danh sách `importData`. Mỗi phần tử đã gồm `signature` |

### `src/modules/integrate-inventory/`

Kho dữ liệu.

| Route | DNC | Việc |
| --- | --- | --- |
| `POST /integrate/inventory/excel-zip` | `integrate/inventory/excel-zip` | JSON `fromDate`, `toDate`. Trả file ZIP. Không có chữ ký |
| `POST /integrate/inventory/update-telco` | `integrate/inventory/update-telco` | `phoneNumber`, `telPartnerCodeUpdate`, `signature` |

### `src/modules/integrate-reconciliation/`

Hậu kiểm.

| Route | DNC | Việc |
| --- | --- | --- |
| `POST /integrate/reconciliation/upload-file` | `integrate/reconciliation/upload-file` | Form-data field `file` (CSV). Không có chữ ký |
| `POST /integrate/reconciliation/create` | `integrate/reconciliation/create` | `fileUrl`, `callbackUrl`, `signature` |
| `POST /integrate/reconciliation/check-recon` | `integrate/reconciliation/check-recon` | `requestId`, `signature` |

### `src/modules/integrate-complain/`

Phản ánh tin nhắn rác / cuộc gọi rác.

| Route | DNC | Việc |
| --- | --- | --- |
| `POST /integrate/complain/excel-zip` | `integrate/complain/excel-zip` | JSON `fromDate`, `toDate`. Trả file ZIP. Không có chữ ký |
| `POST /integrate/complain/excel-import-status` | `integrate/complain/excel-import-status` | Form-data field `file` (Excel). Không có chữ ký. Trạng thái trong file: `NEW`, `BLOCK1`, `BLOCK2`, `RECALL`, `NO_PROCESS` |
| `GET /integrate/complain/get-list-type` | `integrate/complain/get-list-type` | Danh mục loại phản ánh (`id`, `name`). Không có chữ ký |
| `POST /integrate/complain/add` | `integrate/complain/add` | `smsContent`, `prefPhoneNumber`, `complainType`, `ownerPhone`, `evidenceFile` (không bắt buộc), `signature` |

Mỗi module nghiệp vụ có `*.module.ts` (import `DncModule`), `*.controller.ts` (route và Swagger), `*.service.ts` (gọi `DncClient`), `*.dto.ts` (body và schema trên `/docs`).

### `test/`

| File | Chức năng |
| --- | --- |
| `app.e2e-spec.ts` | Boot cả app và gọi `GET /health` |
| `jest-e2e.json` | Cấu hình Jest cho e2e, `rootDir` là thư mục backend |

Unit test nằm cạnh file nguồn (`*.spec.ts`), không nằm trong `test/`.

## Thêm một API

Tạo `src/modules/<tên>/`, import `DncModule`, inject `DncClient`. Gắn `@ApiTags`, `@ApiOperation` và `@ApiOkResponse` để endpoint hiện trên `/docs`. Truyền từng field của body. Chỉ gửi `signature` khi hợp đồng DNC yêu cầu, và lấy nguyên giá trị bên gọi đưa vào.

```ts
return this.dnc.request({
  method: 'POST',
  path: 'integrate/example',
  body: {
    field: input.field,
    signature: input.signature,
  },
});
```

File ZIP dùng `this.dnc.download`. Nếu DNC trả JSON thay vì file, JSON đó được trả nguyên. Upload dùng `form` (`FormData`), không gửi kèm `body`. `request` trả nguyên body DNC gửi về. Lỗi mạng ném `DncTransportError`. Log request tự chạy, không cần gọi logger trong service.
