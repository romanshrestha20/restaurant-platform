import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(1, 50)
  firstName!: string;

  @IsString()
  @Length(1, 50)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'phone must be in international format, for example +358401234567',
  })
  phone?: string;
}
