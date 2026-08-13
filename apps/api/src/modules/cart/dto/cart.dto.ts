import { Type, Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateCartDto {
  @IsString()
  restaurantId!: string;
}

export class CartAddOnSelectionDto {
  @IsString()
  addOnId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;
}

export class AddCartItemDto {
  @IsString()
  menuItemId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  variantOptionIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartAddOnSelectionDto)
  addOns?: CartAddOnSelectionDto[];

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}

export class UpdateCartItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity?: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;
}

export class CartVersionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;
}
