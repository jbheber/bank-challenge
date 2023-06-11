import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [AccountsModule],
  providers: [TasksService],
})
export class TasksModule {}
