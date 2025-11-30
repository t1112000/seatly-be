import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [],
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class GuardModule {}
