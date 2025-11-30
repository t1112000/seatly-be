import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { JobInQueue, QueueName } from 'src/common/enums/processor.enum';
import { SeatService } from './seat.service';
import { SeatStatusEnum } from 'src/common/enums';
import { AppGateway } from '../gateway/gateway.service';
import { SendEventName } from '../gateway/gateway.enum';

@Processor(QueueName.SEAT)
export class SeatProcessor extends WorkerHost {
  constructor(
    @InjectPinoLogger(SeatProcessor.name)
    private readonly logger: PinoLogger,
    @Inject(SeatService)
    private readonly seatService: SeatService,
    @Inject(AppGateway)
    private readonly gateway: AppGateway,
  ) {
    super();
  }

  async process(job: Job<any>) {
    const { name } = job;
    this.logger.info(
      { jobId: job.id, jobName: name },
      'Processing subject job',
    );

    switch (name) {
      case JobInQueue[QueueName.SEAT].UNLOCK_SEAT:
        return this.handleUnlockSeat(
          job as Job<{ seatId: string; version: number }>,
        );
      default:
        this.logger.error({ jobId: job.id, jobName: name }, 'Invalid job name');
        return;
    }
  }

  private async handleUnlockSeat(
    job: Job<{ seatId: string; version: number }>,
  ) {
    const { seatId, version } = job.data;
    const updatedSeat = await this.seatService.updateByCondition(
      { id: seatId, version: version, status: SeatStatusEnum.LOCKED },
      { status: SeatStatusEnum.AVAILABLE },
    );

    if (updatedSeat) {
      await this.gateway.server.emit(SendEventName.SEAT_UPDATED, {
        seatId,
        status: SeatStatusEnum.AVAILABLE,
      });
    }
    return true;
  }
}
