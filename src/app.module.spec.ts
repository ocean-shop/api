import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  it('should compile the module', () => {
    expect(moduleRef).toBeDefined();
  });

  it('should provide AppController', () => {
    expect(moduleRef.get(AppController)).toBeInstanceOf(AppController);
  });

  it('should provide AppService', () => {
    expect(moduleRef.get(AppService)).toBeInstanceOf(AppService);
  });
});
