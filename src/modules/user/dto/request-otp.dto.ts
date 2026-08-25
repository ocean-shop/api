import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';

export class RequestOtpDto {
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ValidateIf((o: RequestOtpDto) => !o.email)
  @IsString()
  @Matches(/^(\+380|380|0)\d{9}$/, {
    message:
      'Phone must be a valid Ukrainian number in +380XXXXXXXXX, 380XXXXXXXXX, or 0XXXXXXXXX format',
  })
  readonly phone?: string;
}
