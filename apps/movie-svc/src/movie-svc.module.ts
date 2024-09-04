import { Module } from '@nestjs/common';
import { MovieSvcController } from './movie-svc.controller';
import { MovieSvcService } from './movie-svc.service';

@Module({
  imports: [],
  controllers: [MovieSvcController],
  providers: [MovieSvcService],
})
export class MovieSvcModule {}
