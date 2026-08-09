import { IsString, Length, MaxLength, MinLength } from 'class-validator';
import { MaxUtf8Bytes } from '../../../common/validation/password.validators';

export class ResetPasswordDto {
  @IsString()
  @Length(64, 64)
  token!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(72)
  @MaxUtf8Bytes(72)
  password!: string;
}
