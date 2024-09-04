import { Injectable } from '@nestjs/common';

@Injectable()
export class MovieSvcService {
  getHello(): string {
    return 'Hello World!';
  }
}
