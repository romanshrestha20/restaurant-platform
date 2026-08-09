import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { MaxUtf8Bytes } from '../../../common/validation/password.validators';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  @MaxUtf8Bytes(72)
  password!: string;
}
