import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RequestLogMiddleware } from './common/middleware/request-log.middleware';
import { APP_CONFIG } from './config/app-config';
import type { AppConfig } from './config/parse-env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  const requestLog = new RequestLogMiddleware();
  app.use((req, res, next) => requestLog.use(req, res, next));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('NoSpam VN')
      .setDescription(
        'Backend API cho kết nối DNC của VNCert. Body trả về giữ nguyên dữ liệu từ DNC. Lỗi kết nối upstream là HTTP 502.',
      )
      .setVersion('1.0.0')
      .build(),
  );
  SwaggerModule.setup('docs', app, document);

  const { port } = app.get<AppConfig>(APP_CONFIG);
  await app.listen(port);
  Logger.log(`API docs http://localhost:${port}/docs`, 'Bootstrap');
}

void bootstrap();
