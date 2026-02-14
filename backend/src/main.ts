import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  // In development allow any origin so the app can be opened from another PC (e.g. http://192.168.x.x:5173)
  const corsOrigin =
    process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL || 'http://localhost:5173'
      : true;
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('PalletMS API')
    .setDescription('Pallet tracking API with RBAC, movements, and reporting')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || process.env.API_PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`API running on http://localhost:${port}/api`);
}

bootstrap().catch(console.error);
