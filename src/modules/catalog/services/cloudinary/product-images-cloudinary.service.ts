import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';

@Injectable()
export class ProductImagesCloudinaryService {
  private configured = false;

  constructor(private readonly configService: ConfigService) {}

  async uploadBase64Image(image: string): Promise<string> {
    this.ensureConfigured();

    try {
      const response = await cloudinary.uploader.upload(image, {
        resource_type: 'image',
        folder: this.configService.get<string>('CLOUDINARY_PRODUCTS_FOLDER'),
      });

      return this.toSecureUrl(response);
    } catch {
      throw new BadRequestException('Failed to upload image to Cloudinary');
    }
  }

  private ensureConfigured(): void {
    if (this.configured) {
      return;
    }

    const cloudinaryUrl = this.configService.get<string>('CLOUDINARY_URL');
    if (cloudinaryUrl) {
      cloudinary.config(cloudinaryUrl);
      this.configured = true;
      return;
    }

    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException('Cloudinary is not configured');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    this.configured = true;
  }

  private toSecureUrl(response: UploadApiResponse): string {
    if (!response.secure_url) {
      throw new BadRequestException('Cloudinary did not return a secure URL');
    }

    return response.secure_url;
  }
}
