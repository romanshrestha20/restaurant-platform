import {
  IsString,
  MaxLength,
  MinLength,
  ValidateBy,
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

const MaxUtf8Bytes = (maximum: number, validationOptions?: ValidationOptions) =>
  ValidateBy(
    {
      name: 'maxUtf8Bytes',
      constraints: [maximum],
      validator: {
        validate(value: unknown) {
          return (
            typeof value === 'string' &&
            Buffer.byteLength(value, 'utf8') <= maximum
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must not exceed ${maximum} UTF-8 bytes`;
        },
      },
    },
    validationOptions,
  );

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
