import { DayOfWeek } from '@restaurant/database/generated';
import { IsBoolean, IsEnum, IsMilitaryTime, IsOptional } from 'class-validator';

export class CreateOpeningHourDto {
  @IsEnum(DayOfWeek)
  day!: DayOfWeek;

  @IsBoolean()
  isClosed!: boolean;

  @IsOptional()
  @IsMilitaryTime()
  opensAt?: string | null;

  @IsOptional()
  @IsMilitaryTime()
  closesAt?: string | null;
}
