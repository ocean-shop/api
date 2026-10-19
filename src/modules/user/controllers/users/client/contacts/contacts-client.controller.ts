import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContactsService } from '../../../../services/contacts/contacts.service';
import { CreateContactDto } from '../../../../dto/create-contact.dto';

@Controller('user/client/contacts')
@ApiTags('User Client Contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Send "Contact us" message to the admin email',
  })
  @ApiBody({ type: CreateContactDto })
  async sendContactMessage(@Body() dto: CreateContactDto) {
    await this.contactsService.sendContactMessage(dto);
  }
}
