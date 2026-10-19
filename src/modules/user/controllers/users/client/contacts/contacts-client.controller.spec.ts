import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts-client.controller';
import { ContactsService } from '../../../../services/contacts/contacts.service';

describe('ContactsController', () => {
  let controller: ContactsController;
  let contactsService: ContactsService;

  beforeEach(async () => {
    const contactsServiceMock = {
      sendContactMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [{ provide: ContactsService, useValue: contactsServiceMock }],
    }).compile();

    controller = module.get<ContactsController>(ContactsController);
    contactsService = module.get<ContactsService>(ContactsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendContactMessage', () => {
    it('should call contactsService.sendContactMessage', async () => {
      const dto = {
        username: 'Іван',
        contact: '+380991234567',
        message: 'Привіт',
      };

      jest
        .mocked(contactsService.sendContactMessage)
        .mockResolvedValue(undefined);

      await controller.sendContactMessage(dto);

      expect(contactsService.sendContactMessage).toHaveBeenCalledWith(dto);
    });
  });
});
