import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { TasksModule } from './tasks/tasks.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    HealthModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    TransactionsModule,
    TasksModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
