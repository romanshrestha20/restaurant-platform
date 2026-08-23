import { IsISO31661Alpha2, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';
export class UpdateAddressDto {
  @IsOptional() @IsString() @Length(1, 30) label?: string;
  @IsOptional() @IsString() @Length(1, 200) street?: string;
  @IsOptional() @IsString() @Length(1, 100) city?: string;
  @IsOptional() @IsString() @Length(1, 20) postalCode?: string;
  @IsOptional() @IsISO31661Alpha2() country?: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 8 }) @Min(-90) @Max(90) latitude?: number | null;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 8 }) @Min(-180) @Max(180) longitude?: number | null;
  @IsOptional() isDefault?: boolean;
}
