import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccountsService } from '../accounts/accounts.service';

@Injectable()
export class TasksService {
  constructor(private readonly accountsService: AccountsService) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT, {
    name: 'InterestGeneratorJob',
  })
  async generateInterests() {
    try {
      const basicSavingsAccounts =
        await this.accountsService.findBasicSavingAccounts();

      const updatedAccountsIds =
        await this.accountsService.generateInterestForAccounts(
          basicSavingsAccounts,
        );
    } catch (err) {
      console.error('Failed to run cron job', err);
    }
  }
}
