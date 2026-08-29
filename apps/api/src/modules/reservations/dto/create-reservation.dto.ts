import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
export class CreateReservationDto {
  @IsString() @IsNotEmpty() restaurantId!: string;
  @IsString() @IsNotEmpty() @MaxLength(100) guestName!: string;
  @IsOptional() @IsString() @MaxLength(255) guestEmail?: string;
  @IsOptional() @IsString() @MaxLength(30) guestPhone?: string;
  @IsInt() @Min(1) @Max(20) guestCount!: number;
  @IsDateString() reservationAt!: string;
  @IsOptional() @IsString() @MaxLength(500) specialRequest?: string;
}
