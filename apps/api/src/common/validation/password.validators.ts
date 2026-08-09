import { ValidateBy, type ValidationOptions } from 'class-validator';

/** bcrypt only considers the first 72 bytes of a password. */
export const MaxUtf8Bytes = (
  maximum: number,
  validationOptions?: ValidationOptions,
) =>
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
        defaultMessage(args) {
          return `${args?.property ?? 'value'} must not exceed ${maximum} UTF-8 bytes`;
        },
      },
    },
    validationOptions,
  );
