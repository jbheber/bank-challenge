import { UserEntity } from './../users/entities/user.entity';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { DatabaseService } from '../database/database.service';
import { AccountsService } from '../accounts/accounts.service';
import { Account_Type } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionResult } from './entities/transaction-result.entity';

@Injectable()
export class TransactionsService {
  private basicSavingsMaxBalance = 0;
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly accountsService: AccountsService,
  ) {
    this.basicSavingsMaxBalance = Number(process.env.BASIC_SAVING_MAX ?? 50000);
  }

  async transfer(
    createTransactionDto: CreateTransactionDto,
    currentUser: UserEntity,
  ): Promise<TransactionResult> {
    // TODO: this operation should be done with help of third party components to avoid multiple deposit happening at the
    // same time and having data race condition. Probably with some queues so as to batch process transactions assuring
    // that the balance is updated correctly.
    const { fromAccount, newFromBalance, newToBalance, toAccount } =
      await this.validatePayload(createTransactionDto, currentUser);

    await this.createTransactions(
      createTransactionDto.description,
      fromAccount.id,
      toAccount.id,
      createTransactionDto.amount,
      newFromBalance,
      newToBalance,
    );
    return {
      newSrcBalance: newFromBalance.valueOf(),
      totalDestBalance: newToBalance.valueOf(),
      transferredAt: new Date().toISOString(),
    };
  }

  private async createTransactions(
    description: string,
    fromAccountId: number,
    toAccountId: number,
    amount: number,
    newFromBalance: Decimal,
    newToBalance: Decimal,
  ) {
    await this.databaseService.client.$transaction([
      this.databaseService.client.transaction.createMany({
        data: [
          {
            description,
            accountId: fromAccountId,
            balance: newFromBalance,
            withdrawal: amount,
          },
          {
            description,
            accountId: toAccountId,
            balance: newToBalance,
            deposit: amount,
          },
        ],
      }),
      this.databaseService.client.account.update({
        where: { id: fromAccountId },
        data: {
          balance: newFromBalance,
        },
      }),
      this.databaseService.client.account.update({
        where: { id: toAccountId },
        data: {
          balance: newToBalance,
        },
      }),
    ]);
  }

  private async validatePayload(
    { fromAccountId, toAccountId, amount }: CreateTransactionDto,
    currentUser: UserEntity,
  ) {
    const currentUserId = currentUser.id;
    const fromAccount = await this.getValidUserAccount(
      fromAccountId,
      currentUserId,
    );
    const newFromBalance = fromAccount.balance.sub(amount);
    if (newFromBalance.isNegative()) {
      throw new BadRequestException('Insufficient funds');
    }
    const toAccount = await this.getValidDestinationAccount(
      toAccountId,
      currentUserId,
    );
    const newToBalance = Decimal.sum(toAccount.balance, amount);
    if (
      toAccount.account_type === Account_Type.BASIC_SAVINGS &&
      newToBalance.greaterThan(this.basicSavingsMaxBalance)
    ) {
      throw new BadRequestException(
        `Basic savings accounts shouldn't exceed ${this.basicSavingsMaxBalance}`,
      );
    }
    return { fromAccount, toAccount, newFromBalance, newToBalance };
  }

  private async getValidUserAccount(
    fromAccountId: number,
    currentUserId: number,
  ) {
    const fromAccount = await this.accountsService.findOne(fromAccountId);
    if (!fromAccount) {
      throw new NotFoundException(`Account with id ${fromAccountId} not found`);
    }
    if (fromAccount.userId !== currentUserId) {
      throw new ForbiddenException(
        `User can't withdraw from account ${fromAccountId}`,
      );
    }
    return fromAccount;
  }

  private async getValidDestinationAccount(
    toAccountId: number,
    currentUserId: number,
  ) {
    const toAccount = await this.accountsService.findOne(toAccountId);
    if (!toAccount) {
      throw new NotFoundException(`Account with id ${toAccountId} not found`);
    }
    if (toAccount.userId === currentUserId) {
      throw new ForbiddenException(`User can't transfer to same user account`);
    }
    return toAccount;
  }

  findAll() {
    return `This action returns all transactions`;
  }
}
