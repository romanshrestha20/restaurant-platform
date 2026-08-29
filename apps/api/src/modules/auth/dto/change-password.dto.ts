import { IsString, MaxLength, MinLength } from 'class-validator';
import { MaxUtf8Bytes } from '../../../common/validation/password.validators';
export class ChangePasswordDto {
  @IsString() @MinLength(1) @MaxLength(72) currentPassword!: string;
  @IsString() @MinLength(12) @MaxLength(72) @MaxUtf8Bytes(72) newPassword!: string;
}
