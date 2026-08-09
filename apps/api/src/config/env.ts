import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3001),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  CLIENT_URL: Joi.string().uri().default('http://localhost:3000'),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .invalid(Joi.ref('JWT_ACCESS_SECRET'))
    .required(),
  JWT_ACCESS_TTL_SECONDS: Joi.number().integer().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: Joi.number().integer().positive().default(2_592_000),
  EMAIL_VERIFICATION_TTL_SECONDS: Joi.number()
    .integer()
    .positive()
    .default(86_400),
  PASSWORD_RESET_TTL_SECONDS: Joi.number().integer().positive().default(3_600),
  MAIL_MODE: Joi.string()
    .valid('log', 'smtp')
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string().valid('smtp').required(),
      otherwise: Joi.string().valid('log', 'smtp').default('log'),
    }),
  MAIL_FROM: Joi.string().email().default('no-reply@restaurant.local'),
  SMTP_HOST: Joi.string().when('MAIL_MODE', {
    is: 'smtp',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().empty('').optional(),
  SMTP_PASSWORD: Joi.string().empty('').optional(),
  UPLOAD_STORAGE_PROVIDER: Joi.string()
    .valid('cloudinary', 'local')
    .when('NODE_ENV', {
      is: 'test',
      then: Joi.string().default('local'),
      otherwise: Joi.string().default('cloudinary'),
    }),
  UPLOAD_LOCAL_DIR: Joi.string().default('uploads'),
  UPLOAD_PUBLIC_URL: Joi.string()
    .uri()
    .default('http://localhost:3001/uploads'),
  CLOUDINARY_CLOUD_NAME: Joi.string()
    .empty('')
    .when('UPLOAD_STORAGE_PROVIDER', {
      is: 'cloudinary',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  CLOUDINARY_API_KEY: Joi.string().empty('').when('UPLOAD_STORAGE_PROVIDER', {
    is: 'cloudinary',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  CLOUDINARY_API_SECRET: Joi.string()
    .empty('')
    .when('UPLOAD_STORAGE_PROVIDER', {
      is: 'cloudinary',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  HEALTH_DATABASE_TIMEOUT_MS: Joi.number().integer().positive().default(3_000),
})
  .and('SMTP_USER', 'SMTP_PASSWORD')
  .and('CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET');

export interface AppEnvironment {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL: string;
  CLIENT_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_TTL_SECONDS: number;
  JWT_REFRESH_TTL_SECONDS: number;
  EMAIL_VERIFICATION_TTL_SECONDS: number;
  PASSWORD_RESET_TTL_SECONDS: number;
  MAIL_MODE: 'log' | 'smtp';
  MAIL_FROM: string;
  SMTP_HOST?: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  UPLOAD_STORAGE_PROVIDER: 'cloudinary' | 'local';
  UPLOAD_LOCAL_DIR: string;
  UPLOAD_PUBLIC_URL: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  HEALTH_DATABASE_TIMEOUT_MS: number;
}
