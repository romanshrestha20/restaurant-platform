import { IsBoolean, IsOptional } from 'class-validator';
import { CreateRestaurantAddressDto } from './create-restaurant-address.dto';

export class AddRestaurantAddressDto extends CreateRestaurantAddressDto {
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
