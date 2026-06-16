import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';

export class VerifyOtpDto {
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ValidateIf((o: VerifyOtpDto) => !o.email)
  @IsString()
  readonly phone?: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  readonly code: string;
}
