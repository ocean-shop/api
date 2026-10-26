import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import {
  CLOUDINARY_CONFIG_KEYS,
  CLOUDINARY_DEFAULT_PRODUCTS_FOLDER,
  CLOUDINARY_RESOURCE_TYPE,
} from '../../constants/cloudinary.constants';
import { IMAGE_MESSAGES } from '../../constants/image-messages.constants';

@Injectable()
export class ProductImagesCloudinaryService {
  constructor(private readonly configService: ConfigService) {}

  async uploadBase64Image(image: string): Promise<string> {
    this.ensureConfigured();
    const normalizedImage = image.trim();

    try {
      const response = await cloudinary.uploader.upload(normalizedImage, {
        resource_type: CLOUDINARY_RESOURCE_TYPE,
        folder:
          this.configService.get<string>(
            CLOUDINARY_CONFIG_KEYS.PRODUCTS_FOLDER,
          ) || CLOUDINARY_DEFAULT_PRODUCTS_FOLDER,
      });

      return this.toSecureUrl(response);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const details = this.extractUploadErrorDetails(error);
      throw new BadRequestException(
        details
          ? `${IMAGE_MESSAGES.UPLOAD_FAILED}: ${details}`
          : IMAGE_MESSAGES.UPLOAD_FAILED,
      );
    }
  }

  private ensureConfigured(): void {
    const cloudName = this.configService.get<string>(
      CLOUDINARY_CONFIG_KEYS.CLOUD_NAME,
    );
    const apiKey = this.configService.get<string>(
      CLOUDINARY_CONFIG_KEYS.API_KEY,
    );
    const apiSecret = this.configService.get<string>(
      CLOUDINARY_CONFIG_KEYS.API_SECRET,
    );

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  private toSecureUrl(response: UploadApiResponse): string {
    if (!response.secure_url) {
      throw new BadRequestException(IMAGE_MESSAGES.MISSING_SECURE_URL);
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
