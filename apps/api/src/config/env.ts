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
  HEALTH_DATABASE_TIMEOUT_MS: Joi.number().integer().positive().default(3_000),
});

export interface AppEnvironment {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL: string;
  CLIENT_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_TTL_SECONDS: number;
  JWT_REFRESH_TTL_SECONDS: number;
  HEALTH_DATABASE_TIMEOUT_MS: number;
}
