import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MaxUtf8Bytes } from '../../../common/validation/password.validators';

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
  @MaxLength(72)
  @MaxUtf8Bytes(72)
  password!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'phone must be in international format, for example +358401234567',
  })
  phone?: string;
}
