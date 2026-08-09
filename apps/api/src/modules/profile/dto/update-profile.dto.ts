import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateBy,
  ValidateIf,
  type ValidationOptions,
} from 'class-validator';

export enum ProfileGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const IsNotFutureDate = (validationOptions?: ValidationOptions) =>
  ValidateBy(
    {
      name: 'isNotFutureDate',
      validator: {
        validate: (value: unknown) => {
          if (typeof value !== 'string') {
            return false;
          }

          const date = new Date(value);
          return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
        },
        defaultMessage: () => 'dateOfBirth must not be in the future',
      },
    },
    validationOptions,
  );

export class UpdateProfileDto {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Length(1, 50)
  firstName?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Length(1, 50)
  lastName?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'phone must be in international format, for example +358401234567',
  })
  phone?: string | null;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(500)
  bio?: string | null;

  @IsOptional()
  @IsEnum(ProfileGender)
  gender?: ProfileGender | null;

  @IsOptional()
  @IsDateString({ strict: true })
  @IsNotFutureDate()
  dateOfBirth?: string | null;
}
