import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ limit: '20mb', extended: true }));

  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: corsOrigin
      ? corsOrigin.split(',').map((origin) => origin.trim())
      : 'http://localhost:3001',
    credentials: true,
  });

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const swaggerEnabled =
    (process.env.SWAGGER_ENABLED ?? 'true').toLowerCase() === 'true';
  if (swaggerEnabled) {
    const swaggerPath = (process.env.SWAGGER_PATH ?? 'docs').replace(
      /^\/+|\/+$/g,
      '',
    );
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Ocean Shop API')
      .setDescription('API documentation for Ocean Shop backend services')
      .setVersion(process.env.npm_package_version ?? '0.0.1')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Provide access token as: Bearer <token>',
        },
        'access-token',
      )
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(swaggerPath, app, swaggerDocument);

    if (swaggerPath.length > 0) {
      // Also expose Swagger UI at root so opening the site shows docs.
      SwaggerModule.setup('', app, swaggerDocument);
    }
  }

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
