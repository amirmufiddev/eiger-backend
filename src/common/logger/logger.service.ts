import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

@Injectable()
export class AppLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    const logLevel = this.configService.get<string>('LOG_LEVEL')!;

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true })),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('EigerAPI', {
              colors: true,
              prettyPrint: true,
              processId: true,
              appName: true,
            }),
          ),
        }),
        new winston.transports.DailyRotateFile({
          level: 'error',
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxFiles: '14d',
        }),
        new winston.transports.DailyRotateFile({
          level: 'warn',
          filename: 'logs/warn-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxFiles: '14d',
        }),
        new winston.transports.DailyRotateFile({
          level: 'debug',
          filename: 'logs/debug-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxFiles: '14d',
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  getLogger(): winston.Logger {
    return this.logger;
  }

  static forRoot() {
    return WinstonModule.createLogger({
      instance: winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true })),
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.ms(),
              nestWinstonModuleUtilities.format.nestLike('EigerAPI', {
                colors: true,
                prettyPrint: true,
                processId: true,
                appName: true,
              }),
            ),
          }),
          new winston.transports.DailyRotateFile({
            level: 'error',
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxFiles: '14d',
          }),
          new winston.transports.DailyRotateFile({
            level: 'warn',
            filename: 'logs/warn-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxFiles: '14d',
          }),
          new winston.transports.DailyRotateFile({
            level: 'debug',
            filename: 'logs/debug-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxFiles: '14d',
          }),
        ],
      }),
    });
  }
}
