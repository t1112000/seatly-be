import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | object;

    if (exception instanceof HttpException) {
      // Handle NestJS HttpExceptions (BadRequestException, UnauthorizedException, etc.)
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      // Handle generic JavaScript errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = {
        message: 'Internal server error',
        error: 'Internal Server Error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };

      // Log the actual error for debugging
      this.logger.error(
        { exception },
        `Unhandled error: ${exception.message}, ${request.method} ${request.url}`,
      );
    } else {
      // Handle any other type of exception
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = {
        message: 'Internal server error',
        error: 'Internal Server Error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };

      this.logger.error(
        { exception },
        `Unknown exception type: ${typeof exception}, ${request.method} ${request.url}`,
      );
    }

    this.logger.error(
      { message },
      `HTTP Exception: ${status} - ${request.method} ${request.url}`,
    );

    response.status(status).json({
      success: false,
      data: message,
    });
  }
}
