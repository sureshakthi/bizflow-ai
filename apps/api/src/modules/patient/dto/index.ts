import { IsString, IsDateString, IsEnum, IsOptional, Matches } from 'class-validator';

enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

enum Language {
  TAMIL = 'TAMIL',
  ENGLISH = 'ENGLISH',
  HINDI = 'HINDI',
  TELUGU = 'TELUGU',
}

enum RegistrationSource {
  WHATSAPP = 'WHATSAPP',
  WEB_FORM = 'WEB_FORM',
  PAPER_OCR = 'PAPER_OCR',
  ADMIN_MANUAL = 'ADMIN_MANUAL',
}

export class CreatePatientDto {
  @IsString()
  name: string;

  @Matches(/^[6-9]\d{9}$/, { message: 'Invalid Indian mobile number' })
  phone: string;

  @IsDateString()
  dob: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsEnum(RegistrationSource)
  registrationSource?: RegistrationSource;

  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  referredBy?: string;
}

export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

export { CreatePatientDto as default };
