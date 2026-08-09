import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CreateOpeningHourDto } from './create-opening-hour.dto';

export class ReplaceOpeningHoursDto {
  @IsArray()
  @ArrayMaxSize(7)
  @ArrayUnique((hour: CreateOpeningHourDto) => hour.day)
  @ValidateNested({ each: true })
  @Type(() => CreateOpeningHourDto)
  openingHours!: CreateOpeningHourDto[];
}
