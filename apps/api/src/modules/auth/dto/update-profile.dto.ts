import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() @Length(1, 50) firstName?: string;
  @IsOptional() @IsString() @Length(1, 50) lastName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @Matches(/^\+[1-9]\d{7,14}$/) phone?: string;
  @IsOptional() @IsString() currentPassword?: string;
}
