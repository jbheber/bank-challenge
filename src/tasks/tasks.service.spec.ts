import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { AccountsService } from '../accounts/accounts.service';
import { DatabaseService } from '../database/database.service';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService, AccountsService, DatabaseService],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
