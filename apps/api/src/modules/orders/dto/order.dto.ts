import { Type, Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderType, OrderStatus, PaymentMethod } from '@restaurant/database/generated';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class DeliveryAddressDto {
  @IsString()
  @IsNotEmpty()
  street!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsString()
  @IsNotEmpty()
  country!: string;
}

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  restaurantId!: string;

  @IsEnum(OrderType)
  type!: OrderType;

  @IsOptional()
  @IsString()
  tableNumber?: string;

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsOptional()
  @IsString()
  deliveryAddressId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @Transform(trim)
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  tipPercentage?: number;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class OrderFilterDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
