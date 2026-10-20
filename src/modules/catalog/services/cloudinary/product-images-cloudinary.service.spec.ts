import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { v2 as cloudinary } from 'cloudinary';
import { IMAGE_MESSAGES } from '../../constants/image-messages.constants';
import { ProductImagesCloudinaryService } from './product-images-cloudinary.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: { upload: jest.fn() },
  },
}));

const IMAGE = 'data:image/png;base64,AAAA';
const SECURE_URL = 'https://res.cloudinary.com/demo/image/upload/1.png';

describe('ProductImagesCloudinaryService', () => {
  let service: ProductImagesCloudinaryService;
  let config: Record<string, string | undefined>;
  const upload = cloudinary.uploader.upload as jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    config = {
      CLOUDINARY_CLOUD_NAME: 'demo',
      CLOUDINARY_API_KEY: 'key',
      CLOUDINARY_API_SECRET: 'secret',
      CLOUDINARY_PRODUCTS_FOLDER: 'products',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductImagesCloudinaryService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => config[key]) },
        },
      ],
    }).compile();

    service = module.get<ProductImagesCloudinaryService>(
      ProductImagesCloudinaryService,
    );
  });

  it('should configure Cloudinary and upload the trimmed image', async () => {
    upload.mockResolvedValue({ secure_url: SECURE_URL });

    const result = await service.uploadBase64Image(`  ${IMAGE}  `);

    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'demo',
      api_key: 'key',
      api_secret: 'secret',
      secure: true,
    });
    expect(upload).toHaveBeenCalledWith(IMAGE, {
      resource_type: 'auto',
      folder: 'products',
    });
    expect(result).toBe(SECURE_URL);
  });

  it('should fall back to the default folder', async () => {
    config.CLOUDINARY_PRODUCTS_FOLDER = undefined;
    upload.mockResolvedValue({ secure_url: SECURE_URL });

    await service.uploadBase64Image(IMAGE);

    expect(upload).toHaveBeenCalledWith(IMAGE, {
      resource_type: 'auto',
      folder: 'shop',
    });
  });

  it('should reject a response without a secure URL', async () => {
    upload.mockResolvedValue({});

    await expect(service.uploadBase64Image(IMAGE)).rejects.toThrow(
      new BadRequestException(IMAGE_MESSAGES.MISSING_SECURE_URL),
    );
  });

  it('should rethrow HTTP exceptions untouched', async () => {
    const error = new NotFoundException('gone');
    upload.mockRejectedValue(error);

    await expect(service.uploadBase64Image(IMAGE)).rejects.toBe(error);
  });

  it.each([
    ['an Error', new Error(' Invalid image '), 'Invalid image'],
    ['a string', ' Timeout ', 'Timeout'],
    ['an object message', { message: 'Bad file' }, 'Bad file'],
    ['a nested error', { error: { message: 'Too large' } }, 'Too large'],
    ['any other object', { http_code: 500 }, '{"http_code":500}'],
  ])('should report the details of %s', async (_label, error, details) => {
    upload.mockRejectedValue(error);

    await expect(service.uploadBase64Image(IMAGE)).rejects.toThrow(
      new BadRequestException(`${IMAGE_MESSAGES.UPLOAD_FAILED}: ${details}`),
    );
  });

  it.each([
    ['nothing', undefined],
    ['an empty string', '   '],
    ['an empty object', {}],
    ['an Error without a message', new Error('')],
  ])('should report no details for %s', async (_label, error) => {
    upload.mockRejectedValue(error);

    await expect(service.uploadBase64Image(IMAGE)).rejects.toThrow(
      new BadRequestException(IMAGE_MESSAGES.UPLOAD_FAILED),
    );
  });
});
