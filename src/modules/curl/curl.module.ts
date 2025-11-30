import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CurlService } from './curl.service';

@Module({
  imports: [HttpModule],
  providers: [CurlService],
  exports: [HttpModule, CurlService],
})
export class CurlModule {}
