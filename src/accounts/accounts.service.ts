import { Injectable } from '@nestjs/common';
import { Account, Account_Type, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { DatabaseService } from '../database/database.service';
import { UserEntity } from '../users/entities/user.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
@Injectable()
export class AccountsService {
  private accountInterest: number;
  private basicSavingsMax: number;

  constructor(private databaseService: DatabaseService) {
    this.accountInterest = Number(process.env.BASIC_SAVING_INTEREST ?? 5);
    this.basicSavingsMax = Number(process.env.BASIC_SAVING_MAX ?? 50000);
  }

  async create(createAccountDto: CreateAccountDto, currentUser: UserEntity) {
    const account = await this.databaseService.client.account.create({
      data: {
        ...createAccountDto,
        userId: currentUser.id,
      },
    });
    return account;
  }

  findAll(skip = 0, take = 100, where = {}) {
    return this.databaseService.client.account.findMany({
      where,
      skip,
      take,
    });
  }

  findOne(
    id: number,
    includeBank = false,
    transactionHistoryQuery: any = null,
    interestHistoryQuery: any = null,
  ) {
    return this.databaseService.client.account.findUnique({
      where: { id },
      include: {
        Bank: includeBank,
        transactions: transactionHistoryQuery ?? false,
        Interest_History: interestHistoryQuery ?? false,
      },
    });
  }

  update(id: number, updateAccountDto: UpdateAccountDto) {
    return this.databaseService.client.account.update({
      where: { id },
      data: {
        ...updateAccountDto,
      },
    });
  }

  remove(id: number) {
    return this.databaseService.client.account.delete({
      where: { id },
    });
  }

  async findBasicSavingAccounts() {
    const where = {
      account_type: Account_Type.BASIC_SAVINGS,
    };
    // ORM limitations can't return paginated result + total count (can do a raw query to get both)
    const recordCount = await this.databaseService.client.account.count({
      where,
    });
    const accountsPromise: Prisma.PrismaPromise<Account[]>[] = [];
    const take = 100;
    for (let i = 0; i < recordCount; i += take) {
      accountsPromise.push(
        this.databaseService.client.account.findMany({
          skip: i,
          take,
          where,
        }),
      );
    }
    const basicSavingsAccounts = await Promise.all(accountsPromise);
    return basicSavingsAccounts.flat();
  }

  async generateInterestForAccounts(accounts: Account[]) {
    const updatePromise = accounts.map((account) =>
      this.generateInterestForAccount(account),
    );
    return Promise.all(updatePromise);
  }

  private async generateInterestForAccount(account: Account) {
    const interest = new Decimal(
      +account.balance * this.accountInterest,
    ).dividedBy(100);
    const updatedBalance = Decimal.min(
      account.balance.add(interest),
      this.basicSavingsMax,
    );
    await this.databaseService.client.account.update({
      where: { id: account.id },
      data: {
        balance: updatedBalance,
        Interest_History: {
          create: {
            interest_amount: interest,
          },
        },
      },
    });
    return account.id;
  }
}
