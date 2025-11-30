import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  public customRequestTotalCounter: Counter<string>;
  public customResponseTotalCounter: Counter<string>;
  public customRequestProcessingTime: Histogram<string>;

  constructor(
    @InjectPinoLogger(MetricsMiddleware.name)
    private readonly logger: PinoLogger,
  ) {
    this.customRequestTotalCounter = new Counter<string>({
      name: 'requests_total',
      help: 'Total count of requests by method and path.',
      labelNames: ['method', 'path'],
    });
    this.customResponseTotalCounter = new Counter<string>({
      name: 'responses_total',
      help: 'Total count of responses by method, path and status codes.',
      labelNames: ['method', 'path', 'status_code'],
    });
    this.customRequestProcessingTime = new Histogram<string>({
      name: 'requests_duration_milliseconds',
      help: 'Histogram of requests processing time by path (in milliseconds)',
      labelNames: ['method', 'path'],
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    try {
      const startTime = Date.now();
      const baseUrl = req.baseUrl;
      this.customRequestTotalCounter.labels(req.method, baseUrl).inc();
      res.on('finish', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        this.customRequestProcessingTime
          .labels(req.method, baseUrl)
          .observe(duration);
        this.customResponseTotalCounter
          .labels(req.method, baseUrl, res.statusCode.toString())
          .inc();
      });
    } catch (error) {
      this.logger.error(error, 'metrics middleware get data fails');
    } finally {
      next();
    }
  }
}
