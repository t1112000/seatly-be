import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class CorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest<Request>();
    // Set CORS headers for the specific route
    response.header('Access-Control-Allow-Origin', request.headers['origin']);
    response.header('Access-Control-Allow-Credentials', 'true');
    return next.handle();
  }
}
