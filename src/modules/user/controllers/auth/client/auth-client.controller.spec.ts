import { Test, TestingModule } from '@nestjs/testing';
import { AuthClientController } from './auth-client.controller';
import { AuthClientService } from '../../../services/auth-client/auth-client.service';
import { RequestClientOtpDto } from '../../../dto/request-client-otp.dto';

describe('AuthClientController', () => {
  let controller: AuthClientController;
  let authClientService: AuthClientService;

  beforeEach(async () => {
    const authClientServiceMock = {
      requestOtp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthClientController],
      providers: [
        { provide: AuthClientService, useValue: authClientServiceMock },
      ],
    }).compile();

    controller = module.get<AuthClientController>(AuthClientController);
    authClientService = module.get<AuthClientService>(AuthClientService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('requestOtp', () => {
    it('should call authClientService.requestOtp with the correct dto', async () => {
      const dto: RequestClientOtpDto = { login: 'client@example.com' };
      const expectedResult = { message: 'OTP-код успішно надіслано' };
      jest
        .spyOn(authClientService, 'requestOtp')
        .mockResolvedValue(expectedResult);

      const result = await controller.requestOtp(dto);

      expect(authClientService.requestOtp).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });
});
