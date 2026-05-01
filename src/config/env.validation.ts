import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsString, Max, Min, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsNotEmpty()
  NODE_ENV!: Environment;

  @IsNumber()
  @Min(1024)
  @Max(65535)
  PORT!: number;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN!: string;

  @IsString()
  @IsNotEmpty()
  LOG_LEVEL!: string;
}

class DatabaseVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_HOST!: string;

  @IsNumber()
  DATABASE_PORT!: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_NAME!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_USERNAME!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_PASSWORD!: string;
}

class RedisVariables {
  @IsString()
  @IsNotEmpty()
  REDIS_URL!: string;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST!: string;

  @IsNumber()
  REDIS_PORT!: number;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }

  return validatedConfig;
}
