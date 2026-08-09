import {
  IsString,
  MaxLength,
  MinLength,
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';
import { MaxUtf8Bytes } from '../../../common/validation/password.validators';

const MatchesProperty =
  (property: string, validationOptions?: ValidationOptions) =>
  (object: object, propertyName: string) => {
    registerDecorator({
      name: 'matchesProperty',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedProperty] = args.constraints as [string];
          const source = args.object as Record<string, unknown>;
          return value === source[relatedProperty];
        },
      },
    });
  };

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(72)
  @MaxUtf8Bytes(72)
  newPassword!: string;

  @IsString()
  @MatchesProperty('newPassword', {
    message: 'confirmPassword must match newPassword',
  })
  confirmPassword!: string;
}
