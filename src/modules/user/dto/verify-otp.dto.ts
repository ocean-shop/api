import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';

export class VerifyOtpDto {
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ValidateIf((o: VerifyOtpDto) => !o.email)
  @IsString()
  @Matches(/^(\+380|380|0)\d{9}$/, {
    message:
      'Phone must be a valid Ukrainian number in +380XXXXXXXXX, 380XXXXXXXXX, or 0XXXXXXXXX format',
  })
  readonly phone?: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  readonly code: string;
}
