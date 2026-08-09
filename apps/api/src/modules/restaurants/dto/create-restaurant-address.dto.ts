import { Transform } from 'class-transformer';
import {
  IsISO31661Alpha2,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const normalizeCountry = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class CreateRestaurantAddressDto {
  @Transform(trimString)
  @IsString()
  @Length(1, 50)
  label!: string;

  @Transform(trimString)
  @IsString()
  @Length(1, 200)
  street!: string;

  @Transform(trimString)
  @IsString()
  @Length(1, 100)
  city!: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(100)
  state?: string | null;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(20)
  postalCode?: string | null;

  @Transform(normalizeCountry)
  @IsISO31661Alpha2()
  country!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(-180)
  @Max(180)
  longitude?: number | null;
}
