import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsISO4217CurrencyCode,
  IsOptional,
  IsString,
  IsTimeZone,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const normalizeLowercase = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const normalizeUppercase = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class UpdateRestaurantDto {
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @Length(2, 100)
  name?: string;

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
}
