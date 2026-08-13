import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { CategoryStatus, MenuItemStatus } from '@restaurant/database/generated';
import { PaginationQueryDto } from '../../../common/pagination';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const normalizeSku = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class CreateMenuDto {
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1_000)
  description?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMenuDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1_000)
  description?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateMenuCategoryDto {
  @IsString()
  menuId!: string;

  @Transform(trim)
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1_000)
  description?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;
}

export class UpdateMenuCategoryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1_000)
  description?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;
}

export class CreateMenuItemDto {
  @IsString()
  categoryId!: string;

  @Transform(trim)
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2_000)
  description?: string | null;

  @IsOptional()
  @Transform(normalizeSku)
  @IsString()
  @Length(1, 64)
  sku?: string | null;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  /** Preparation time in minutes. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  preparationTime?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  calories?: number | null;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsEnum(MenuItemStatus)
  status?: MenuItemStatus;
}

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 120)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2_000)
  description?: string | null;

  @IsOptional()
  @Transform(normalizeSku)
  @IsString()
  @Length(1, 64)
  sku?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  /** Preparation time in minutes. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  preparationTime?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  calories?: number | null;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsEnum(MenuItemStatus)
  status?: MenuItemStatus;
}

export class MenuListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['name', 'sortOrder', 'createdAt'])
  declare sort?: string;
}

export class MenuCategoryListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['name', 'sortOrder', 'createdAt'])
  declare sort?: string;

  @IsOptional()
  @IsString()
  menuId?: string;

  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;
}

export class MenuItemListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['name', 'price', 'sortOrder', 'createdAt'])
  declare sort?: string;

  @IsOptional()
  @IsString()
  menuId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsEnum(MenuItemStatus)
  status?: MenuItemStatus;
}

export class CreateVariantDto {
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateVariantDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateVariantOptionDto {
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  name!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  priceAdjustment!: number;
}

export class UpdateVariantOptionDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  priceAdjustment?: number;
}

export class CreateAddOnGroupDto {
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minSelection?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxSelection?: number;
}

export class UpdateAddOnGroupDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minSelection?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxSelection?: number;
}

export class CreateAddOnDto {
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  name!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class UpdateAddOnDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
