import { Injectable, NestMiddleware } from '@nestjs/common';
import { context, propagation, trace } from '@opentelemetry/api';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class OtelTracingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const extracted = propagation.extract(context.active(), req.headers as any);
    const tracer = trace.getTracer('be');
    const span = tracer.startSpan(
      `${req.method} ${req.originalUrl}`,
      undefined,
      extracted,
    );

    res.on('finish', () => span.end());

    context.with(trace.setSpan(extracted, span), () => next());
  }
}
