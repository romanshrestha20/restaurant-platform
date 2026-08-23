import { Transform } from 'class-transformer';
import { IsISO31661Alpha2, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';
const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
export class CreateAddressDto {
  @Transform(trim) @IsString() @Length(1, 30) label!: string;
  @Transform(trim) @IsString() @Length(1, 200) street!: string;
  @Transform(trim) @IsString() @Length(1, 100) city!: string;
  @Transform(trim) @IsString() @Length(1, 20) postalCode!: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value) @IsISO31661Alpha2() country!: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 8 }) @Min(-90) @Max(90) latitude?: number | null;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 8 }) @Min(-180) @Max(180) longitude?: number | null;
  @IsOptional() isDefault?: boolean;
}
