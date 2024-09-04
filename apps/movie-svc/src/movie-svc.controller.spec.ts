import { Test, TestingModule } from '@nestjs/testing';
import { MovieSvcController } from './movie-svc.controller';
import { MovieSvcService } from './movie-svc.service';

describe('MovieSvcController', () => {
  let movieSvcController: MovieSvcController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MovieSvcController],
      providers: [MovieSvcService],
    }).compile();

    movieSvcController = app.get<MovieSvcController>(MovieSvcController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(movieSvcController.getHello()).toBe('Hello World!');
    });
  });
});
