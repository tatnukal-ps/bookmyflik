import { NestFactory } from '@nestjs/core';
import { MovieSvcModule } from './movie-svc.module';

async function bootstrap() {
  const app = await NestFactory.create(MovieSvcModule);
  await app.listen(3000);
}
bootstrap();
