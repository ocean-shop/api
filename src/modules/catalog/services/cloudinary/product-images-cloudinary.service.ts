import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';

@Injectable()
export class ProductImagesCloudinaryService {
  constructor(private readonly configService: ConfigService) {}

  async uploadBase64Image(image: string): Promise<string> {
    this.ensureConfigured();
    const normalizedImage = image.trim();

    try {
      const response = await cloudinary.uploader.upload(normalizedImage, {
        resource_type: 'auto',
        folder:
          this.configService.get<string>('CLOUDINARY_PRODUCTS_FOLDER') ||
          'shop',
      });

      return this.toSecureUrl(response);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const details = this.extractUploadErrorDetails(error);
      throw new BadRequestException(
        details
          ? `Не вдалося завантажити зображення до Cloudinary: ${details}`
          : 'Не вдалося завантажити зображення до Cloudinary',
      );
    }
  }

  private ensureConfigured(): void {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  private toSecureUrl(response: UploadApiResponse): string {
    if (!response.secure_url) {
      throw new BadRequestException('Cloudinary не повернув безпечний URL');
    }

    return response.secure_url;
  }

  private extractUploadErrorDetails(error: unknown): string | null {
    if (typeof error === 'string') {
      const message = error.trim();
      return message || null;
    }

    if (!(error instanceof Error)) {
      return this.extractMessageFromUnknownObject(error);
    }

    const message = error.message.trim();
    if (!message) {
      return this.extractMessageFromUnknownObject(error);
    }

    return message;
  }

  private extractMessageFromUnknownObject(error: unknown): string | null {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const value = error as Record<string, unknown>;
    const directMessage = this.toText(value.message);
    if (directMessage) {
      return directMessage;
    }

    const nestedError = value.error;
    if (nestedError && typeof nestedError === 'object') {
      const nestedMessage = this.toText(
        (nestedError as Record<string, unknown>).message,
      );
      if (nestedMessage) {
        return nestedMessage;
      }
    }

    try {
      const serialized = JSON.stringify(error);
      return serialized === '{}' ? null : serialized;
    } catch {
      return null;
    }
  }

  private toText(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const message = value.trim();
    return message || null;
  }
}
