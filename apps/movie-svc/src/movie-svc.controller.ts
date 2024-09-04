import { Controller, Get } from '@nestjs/common';
import { MovieSvcService } from './movie-svc.service';

@Controller()
export class MovieSvcController {
  constructor(private readonly movieSvcService: MovieSvcService) {}

  @Get()
  getHello(): string {
    return this.movieSvcService.getHello();
  }
}
