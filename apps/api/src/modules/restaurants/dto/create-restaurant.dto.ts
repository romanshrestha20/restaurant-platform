import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDefined,
  IsEmail,
  IsISO4217CurrencyCode,
  IsOptional,
  IsString,
  IsTimeZone,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateOpeningHourDto } from './create-opening-hour.dto';
import { CreateRestaurantAddressDto } from './create-restaurant-address.dto';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const normalizeLowercase = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const normalizeUppercase = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class CreateRestaurantDto {
  @Transform(trimString)
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsOptional()
  @Transform(normalizeLowercase)
  @IsString()
  @Length(2, 80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must contain lowercase letters, numbers, and hyphens only',
  })
  slug?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(2_000)
  description?: string | null;

  @IsOptional()
  @Transform(normalizeLowercase)
  @IsEmail()
  @MaxLength(254)
  email?: string | null;

  @IsOptional()
  @Transform(trimString)
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'phone must be in international format, for example +358401234567',
  })
  phone?: string | null;

  @IsOptional()
  @Transform(normalizeUppercase)
  @IsISO4217CurrencyCode()
  currency?: string;

  @IsOptional()
  @Transform(trimString)
  @IsTimeZone()
  timezone?: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => CreateRestaurantAddressDto)
  primaryAddress!: CreateRestaurantAddressDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @ArrayUnique((hour: CreateOpeningHourDto) => hour.day)
  @ValidateNested({ each: true })
  @Type(() => CreateOpeningHourDto)
  openingHours?: CreateOpeningHourDto[];
}
