import { IsEmail, IsOptional, IsString, ValidateIf } from 'class-validator';

export class RequestOtpDto {
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ValidateIf((o: RequestOtpDto) => !o.email)
  @IsString()
  readonly phone?: string;
}
